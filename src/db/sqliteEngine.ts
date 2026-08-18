import initSqlJs, { Database } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import {
  Equipment,
  LogField,
  LogEntry,
  User,
  AuditRecord,
  SqlQueryResult,
  TableSchema,
  DatabaseStats
} from '../types';
import { INITIAL_USERS, INITIAL_EQUIPMENT, INITIAL_FIELDS, INITIAL_LOGS, INITIAL_AUDIT } from './seedData';
import { fmtDT, generateUid, hashPassword } from '../utils/dateTime';

const IDB_DB_NAME = 'eLog_SQLite_Store';
const IDB_STORE_NAME = 'database_file';
const IDB_KEY = 'current_sqlite_binary';

class SqliteEngine {
  private db: Database | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private changeListeners: Set<() => void> = new Set();
  private saveDebounceTimer: any = null;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: () => sqlWasmUrl
        });

        // Try to load existing database from IndexedDB
        const existingBinary = await this.loadFromIndexedDB();
        if (existingBinary && existingBinary.length > 0) {
          try {
            this.db = new SQL.Database(existingBinary);
          } catch (err) {
            console.warn('Failed to load existing SQLite database from IndexedDB, re-creating from schema:', err);
            this.db = new SQL.Database();
            this.bootstrapSchema();
          }
        } else {
          this.db = new SQL.Database();
          this.bootstrapSchema();
        }

        this.isInitialized = true;
        this.notifyChange();
      } catch (e) {
        console.error('Failed to initialize SQLite WebAssembly engine:', e);
        throw e;
      }
    })();

    return this.initPromise;
  }

  private bootstrapSchema() {
    if (!this.db) return;

    this.db.run(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Operator',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        model TEXT,
        serial_no TEXT,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS log_fields (
        id TEXT PRIMARY KEY,
        field_key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        required INTEGER NOT NULL DEFAULT 0,
        enabled INTEGER NOT NULL DEFAULT 1,
        system INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        options_json TEXT
      );

      CREATE TABLE IF NOT EXISTS log_entries (
        id TEXT PRIMARY KEY,
        equipment_id TEXT NOT NULL,
        entry_no TEXT NOT NULL,
        values_json TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_trail (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        dt_display TEXT NOT NULL,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_name TEXT,
        details TEXT,
        signature_hash TEXT
      );

      CREATE TABLE IF NOT EXISTS db_metadata (
        meta_key TEXT PRIMARY KEY,
        meta_value TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_log_entries_eq ON log_entries(equipment_id);
      CREATE INDEX IF NOT EXISTS idx_log_entries_created ON log_entries(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_trail(timestamp);
    `);

    // Check if tables are populated; if not, seed initial data
    const userCountResult = this.db.exec("SELECT COUNT(*) AS count FROM users");
    const count = userCountResult[0]?.values[0]?.[0] as number;

    if (count === 0) {
      this.seedInitialData();
    }

    this.persistToIndexedDB();
  }

  private seedInitialData() {
    if (!this.db) return;

    // Seed Users
    const userStmt = this.db.prepare(
      "INSERT INTO users (id, username, full_name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const u of INITIAL_USERS) {
      userStmt.run([u.id, u.username, u.fullName, u.passwordHash, u.role, u.createdAt]);
    }
    userStmt.free();

    // Seed Equipment
    const eqStmt = this.db.prepare(
      "INSERT INTO equipment (id, name, model, serial_no, location, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const eq of INITIAL_EQUIPMENT) {
      eqStmt.run([eq.id, eq.name, eq.model || null, eq.serialNo || null, eq.location || null, eq.status, eq.notes || null, eq.createdAt, eq.updatedAt]);
    }
    eqStmt.free();

    // Seed Log Fields
    const fieldStmt = this.db.prepare(
      "INSERT INTO log_fields (id, field_key, name, type, required, enabled, system, sort_order, options_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const f of INITIAL_FIELDS) {
      fieldStmt.run([
        f.id,
        f.fieldKey,
        f.name,
        f.type,
        f.required ? 1 : 0,
        f.enabled ? 1 : 0,
        f.system ? 1 : 0,
        f.sortOrder,
        f.options ? JSON.stringify(f.options) : null
      ]);
    }
    fieldStmt.free();

    // Seed Log Entries
    const logStmt = this.db.prepare(
      "INSERT INTO log_entries (id, equipment_id, entry_no, values_json, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    for (const log of INITIAL_LOGS) {
      logStmt.run([
        log.id,
        log.equipmentId,
        log.entryNo,
        JSON.stringify(log.values),
        log.createdBy,
        log.createdAt,
        log.updatedAt
      ]);
    }
    logStmt.free();

    // Seed Audit Trail
    const auditStmt = this.db.prepare(
      "INSERT INTO audit_trail (id, timestamp, dt_display, user_name, action, entity_type, entity_name, details, signature_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const aud of INITIAL_AUDIT) {
      auditStmt.run([
        aud.id,
        aud.timestamp,
        aud.dtDisplay,
        aud.user,
        aud.action,
        aud.entityType,
        aud.entityName || null,
        aud.details || null,
        aud.signatureHash || null
      ]);
    }
    auditStmt.free();

    // Metadata
    this.db.run(
      "INSERT OR REPLACE INTO db_metadata (meta_key, meta_value) VALUES ('version', '1.0'), ('db_engine', 'SQLite 3 WebAssembly'), ('app_name', 'eLOG Equipment Usage System')"
    );
  }

  // ---------- Listener & Persistence ----------
  public subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private notifyChange() {
    this.changeListeners.forEach(listener => {
      try { listener(); } catch (e) { console.error('Listener error:', e); }
    });
    this.scheduleSave();
  }

  private scheduleSave() {
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(() => {
      this.persistToIndexedDB();
    }, 200);
  }

  private async persistToIndexedDB(): Promise<void> {
    if (!this.db) return;
    try {
      const binary = this.db.export();
      await this.saveToIndexedDB(binary);
    } catch (err) {
      console.error('Failed to export SQLite database to IndexedDB:', err);
    }
  }

  private openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveToIndexedDB(data: Uint8Array): Promise<void> {
    const idb = await this.openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.put(data, IDB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      const idb = await this.openIDB();
      return new Promise((resolve, reject) => {
        const tx = idb.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(IDB_KEY);
        req.onsuccess = () => {
          if (req.result instanceof Uint8Array) {
            resolve(req.result);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  // ---------- Raw SQL Execution ----------
  public executeSql(sql: string): SqlQueryResult {
    if (!this.db) {
      return { columns: [], values: [], rowsCount: 0, executionTimeMs: 0, error: 'Database not initialized' };
    }

    const start = performance.now();
    try {
      const trimmed = sql.trim();
      const results = this.db.exec(trimmed);
      const elapsed = performance.now() - start;

      const isMutation = /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)/i.test(trimmed);
      let affectedRows = 0;
      if (isMutation) {
        affectedRows = this.db.getRowsModified();
        this.notifyChange();
      }

      if (results.length > 0) {
        const res = results[0];
        return {
          columns: res.columns,
          values: res.values,
          rowsCount: res.values.length,
          executionTimeMs: Math.round(elapsed * 100) / 100,
          affectedRows
        };
      }

      return {
        columns: [],
        values: [],
        rowsCount: 0,
        executionTimeMs: Math.round(elapsed * 100) / 100,
        affectedRows
      };
    } catch (err: any) {
      const elapsed = performance.now() - start;
      return {
        columns: [],
        values: [],
        rowsCount: 0,
        executionTimeMs: Math.round(elapsed * 100) / 100,
        error: err.message || String(err)
      };
    }
  }

  // ---------- Table Schema & Stats ----------
  public getTableSchemas(): TableSchema[] {
    if (!this.db) return [];
    try {
      const tablesRes = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;");
      if (!tablesRes.length) return [];

      const tables: TableSchema[] = [];
      for (const row of tablesRes[0].values) {
        const tableName = row[0] as string;
        const colRes = this.db.exec(`PRAGMA table_info(${tableName});`);
        const countRes = this.db.exec(`SELECT COUNT(*) FROM ${tableName};`);
        const ddlRes = this.db.exec(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}';`);

        const columns = colRes.length
          ? colRes[0].values.map(col => ({
              cid: col[0] as number,
              name: col[1] as string,
              type: col[2] as string,
              notnull: col[3] as number,
              dflt_value: col[4],
              pk: col[5] as number
            }))
          : [];

        const rowCount = (countRes[0]?.values[0]?.[0] as number) || 0;
        const ddl = (ddlRes[0]?.values[0]?.[0] as string) || '';

        tables.push({
          name: tableName,
          columns,
          rowCount,
          ddl
        });
      }
      return tables;
    } catch (e) {
      console.error('Error fetching table schemas:', e);
      return [];
    }
  }

  public getDatabaseStats(): DatabaseStats {
    if (!this.db) {
      return { pageSize: 4096, pageCount: 0, sizeBytes: 0, totalTables: 0, totalRecords: 0, integrityOk: false, lastSync: Date.now() };
    }
    try {
      const pageCountRes = this.db.exec("PRAGMA page_count;");
      const pageSizeRes = this.db.exec("PRAGMA page_size;");
      const integrityRes = this.db.exec("PRAGMA integrity_check;");

      const pageCount = (pageCountRes[0]?.values[0]?.[0] as number) || 0;
      const pageSize = (pageSizeRes[0]?.values[0]?.[0] as number) || 4096;
      const integrityOk = integrityRes[0]?.values[0]?.[0] === 'ok';

      const schemas = this.getTableSchemas();
      const totalRecords = schemas.reduce((sum, t) => sum + t.rowCount, 0);

      return {
        pageSize,
        pageCount,
        sizeBytes: pageCount * pageSize,
        totalTables: schemas.length,
        totalRecords,
        integrityOk,
        lastSync: Date.now()
      };
    } catch {
      return { pageSize: 4096, pageCount: 0, sizeBytes: 0, totalTables: 0, totalRecords: 0, integrityOk: false, lastSync: Date.now() };
    }
  }

  // ---------- High-Level Typed CRUD API ----------

  // --- Equipment ---
  public getEquipment(): Equipment[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec("SELECT id, name, model, serial_no, location, status, notes, created_at, updated_at FROM equipment ORDER BY name ASC;");
      if (!res.length) return [];
      return res[0].values.map(row => ({
        id: row[0] as string,
        name: row[1] as string,
        model: (row[2] as string) || undefined,
        serialNo: (row[3] as string) || undefined,
        location: (row[4] as string) || undefined,
        status: row[5] as any,
        notes: (row[6] as string) || undefined,
        createdAt: row[7] as number,
        updatedAt: row[8] as number
      }));
    } catch (e) {
      console.error('getEquipment error:', e);
      return [];
    }
  }

  public saveEquipment(eq: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, existingId?: string): Equipment {
    if (!this.db) throw new Error('Database not ready');
    const now = Date.now();
    const idToUpdate = existingId || eq.id;
    if (idToUpdate) {
      const existing = this.getEquipment().find(e => e.id === idToUpdate);
      if (!existing) throw new Error('Equipment not found');
      
      const stmt = this.db.prepare(
        "UPDATE equipment SET name = ?, model = ?, serial_no = ?, location = ?, status = ?, notes = ?, updated_at = ? WHERE id = ?"
      );
      stmt.run([eq.name, eq.model || null, eq.serialNo || null, eq.location || null, eq.status, eq.notes || null, now, idToUpdate]);
      stmt.free();

      this.notifyChange();
      return { ...existing, ...eq, id: idToUpdate, updatedAt: now };
    } else {
      const id = generateUid('eq');
      const stmt = this.db.prepare(
        "INSERT INTO equipment (id, name, model, serial_no, location, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run([id, eq.name, eq.model || null, eq.serialNo || null, eq.location || null, eq.status, eq.notes || null, now, now]);
      stmt.free();

      this.notifyChange();
      return { id, ...eq, createdAt: now, updatedAt: now };
    }
  }

  public deleteEquipment(id: string): void {
    if (!this.db) return;
    const stmt = this.db.prepare("DELETE FROM equipment WHERE id = ?");
    stmt.run([id]);
    stmt.free();
    this.notifyChange();
  }

  // --- Log Fields ---
  public getFields(): LogField[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec("SELECT id, field_key, name, type, required, enabled, system, sort_order, options_json FROM log_fields ORDER BY sort_order ASC;");
      if (!res.length) return [];
      return res[0].values.map(row => {
        let options: string[] | undefined = undefined;
        if (row[8]) {
          try { options = JSON.parse(row[8] as string); } catch { /* ignore */ }
        }
        return {
          id: row[0] as string,
          fieldKey: row[1] as string,
          name: row[2] as string,
          type: row[3] as any,
          required: Boolean(row[4]),
          enabled: Boolean(row[5]),
          system: Boolean(row[6]),
          sortOrder: row[7] as number,
          options
        };
      });
    } catch (e) {
      console.error('getFields error:', e);
      return [];
    }
  }

  public saveField(field: Omit<LogField, 'id' | 'fieldKey' | 'sortOrder'> & { id?: string; fieldKey?: string; sortOrder?: number }, existingId?: string): LogField {
    if (!this.db) throw new Error('Database not ready');
    const existingFields = this.getFields();
    const idToUpdate = existingId || field.id;
    if (idToUpdate) {
      const existing = existingFields.find(f => f.id === idToUpdate);
      if (!existing) throw new Error('Field not found');

      const optionsJson = field.options && field.options.length ? JSON.stringify(field.options) : null;
      const stmt = this.db.prepare(
        "UPDATE log_fields SET name = ?, type = ?, required = ?, enabled = ?, options_json = ? WHERE id = ?"
      );
      stmt.run([field.name, field.type, field.required ? 1 : 0, field.enabled ? 1 : 0, optionsJson, idToUpdate]);
      stmt.free();

      this.notifyChange();
      return { ...existing, ...field, id: idToUpdate, options: field.options };
    } else {
      const id = generateUid('fd');
      const fieldKey = field.fieldKey || ('f_' + Date.now().toString(36));
      const maxSort = existingFields.reduce((m, f) => Math.max(m, f.sortOrder || 0), 0);
      const sortOrder = field.sortOrder ?? (maxSort + 1);
      const optionsJson = field.options && field.options.length ? JSON.stringify(field.options) : null;

      const stmt = this.db.prepare(
        "INSERT INTO log_fields (id, field_key, name, type, required, enabled, system, sort_order, options_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run([id, fieldKey, field.name, field.type, field.required ? 1 : 0, field.enabled ? 1 : 0, field.system ? 1 : 0, sortOrder, optionsJson]);
      stmt.free();

      this.notifyChange();
      return {
        id,
        fieldKey,
        name: field.name,
        type: field.type,
        required: field.required,
        enabled: field.enabled,
        system: field.system || false,
        sortOrder,
        options: field.options
      };
    }
  }

  public toggleField(id: string, enabled: boolean): void {
    if (!this.db) return;
    const stmt = this.db.prepare("UPDATE log_fields SET enabled = ? WHERE id = ?");
    stmt.run([enabled ? 1 : 0, id]);
    stmt.free();
    this.notifyChange();
  }

  public deleteField(id: string): void {
    if (!this.db) return;
    const stmt = this.db.prepare("DELETE FROM log_fields WHERE id = ? AND system = 0");
    stmt.run([id]);
    stmt.free();
    this.notifyChange();
  }

  // --- Log Entries ---
  public getLogEntries(equipmentId?: string): LogEntry[] {
    if (!this.db) return [];
    try {
      const sql = equipmentId
        ? `SELECT id, equipment_id, entry_no, values_json, created_by, created_at, updated_at FROM log_entries WHERE equipment_id = '${equipmentId.replace(/'/g, "''")}' ORDER BY created_at DESC;`
        : "SELECT id, equipment_id, entry_no, values_json, created_by, created_at, updated_at FROM log_entries ORDER BY created_at DESC;";
      const res = this.db.exec(sql);
      if (!res.length) return [];
      return res[0].values.map(row => {
        let values: Record<string, string> = {};
        try { values = JSON.parse(row[3] as string); } catch { /* ignore */ }
        return {
          id: row[0] as string,
          equipmentId: row[1] as string,
          entryNo: row[2] as string,
          values,
          createdBy: row[4] as string,
          createdAt: row[5] as number,
          updatedAt: row[6] as number
        };
      });
    } catch (e) {
      console.error('getLogEntries error:', e);
      return [];
    }
  }

  public getNextEntryNo(equipmentId: string): string {
    if (!this.db) return '0001';
    try {
      const res = this.db.exec(`SELECT COUNT(*) FROM log_entries WHERE equipment_id = '${equipmentId.replace(/'/g, "''")}';`);
      const count = (res[0]?.values[0]?.[0] as number) || 0;
      return String(count + 1).padStart(4, '0');
    } catch {
      return '0001';
    }
  }

  public saveLogEntry(entry: { id?: string; equipmentId: string; entryNo?: string; values: Record<string, string>; createdBy?: string }, existingId?: string): LogEntry {
    if (!this.db) throw new Error('Database not ready');
    const now = Date.now();
    const idToUpdate = existingId || entry.id;
    if (idToUpdate) {
      const stmt = this.db.prepare(
        "UPDATE log_entries SET equipment_id = ?, values_json = ?, updated_at = ? WHERE id = ?"
      );
      stmt.run([entry.equipmentId, JSON.stringify(entry.values), now, idToUpdate]);
      stmt.free();

      this.notifyChange();
      const all = this.getLogEntries();
      const updated = all.find(l => l.id === idToUpdate)!;
      return updated;
    } else {
      const id = generateUid('log');
      const entryNo = entry.entryNo || this.getNextEntryNo(entry.equipmentId);
      const createdBy = entry.createdBy || 'Operator';
      const stmt = this.db.prepare(
        "INSERT INTO log_entries (id, equipment_id, entry_no, values_json, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      stmt.run([id, entry.equipmentId, entryNo, JSON.stringify(entry.values), createdBy, now, now]);
      stmt.free();

      this.notifyChange();
      return {
        id,
        equipmentId: entry.equipmentId,
        entryNo,
        values: entry.values,
        createdBy,
        createdAt: now,
        updatedAt: now
      };
    }
  }

  public deleteLogEntry(id: string): void {
    if (!this.db) return;
    const stmt = this.db.prepare("DELETE FROM log_entries WHERE id = ?");
    stmt.run([id]);
    stmt.free();
    this.notifyChange();
  }

  // --- Users & Authentication ---
  public getUsers(): User[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec("SELECT id, username, full_name, password_hash, role, created_at FROM users ORDER BY full_name ASC;");
      if (!res.length) return [];
      return res[0].values.map(row => ({
        id: row[0] as string,
        username: row[1] as string,
        fullName: row[2] as string,
        passwordHash: row[3] as string,
        role: row[4] as any,
        createdAt: row[5] as number
      }));
    } catch (e) {
      console.error('getUsers error:', e);
      return [];
    }
  }

  public login(username: string, passwordPlainOrHash: string): User | null {
    const users = this.getUsers();
    const hash = hashPassword(passwordPlainOrHash);
    const matched = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && (u.passwordHash === hash || u.passwordHash === passwordPlainOrHash)
    );
    if (matched) {
      this.addAudit({
        user: matched.fullName,
        action: 'Login',
        entityType: 'User',
        entityName: matched.username,
        details: 'User authenticated successfully with 21 CFR electronic signature credentials'
      });
      return matched;
    }
    return null;
  }

  public registerUser(username: string, passwordPlain: string, fullName: string, role: 'Admin' | 'Operator'): User {
    const users = this.getUsers();
    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      throw new Error('Username already exists.');
    }
    const hash = hashPassword(passwordPlain);
    const user = this.saveUser({
      username: username.trim(),
      passwordHash: hash,
      fullName: fullName.trim(),
      role
    });
    this.addAudit({
      user: fullName,
      action: 'Register',
      entityType: 'User',
      entityName: username,
      details: `User account created with role ${role}`
    });
    return user;
  }

  public saveUser(user: { id?: string; username: string; fullName: string; passwordHash: string; role: 'Admin' | 'Operator' }, existingId?: string): User {
    if (!this.db) throw new Error('Database not ready');
    const now = Date.now();
    const idToUpdate = existingId || user.id;
    const finalHash = user.passwordHash.length > 20 ? user.passwordHash : hashPassword(user.passwordHash);
    if (idToUpdate) {
      const existing = this.getUsers().find(u => u.id === idToUpdate);
      const updateHash = user.passwordHash ? finalHash : (existing?.passwordHash || finalHash);
      const stmt = this.db.prepare(
        "UPDATE users SET username = ?, full_name = ?, password_hash = ?, role = ? WHERE id = ?"
      );
      stmt.run([user.username, user.fullName, updateHash, user.role, idToUpdate]);
      stmt.free();
      this.notifyChange();
      return { id: idToUpdate, username: user.username, fullName: user.fullName, passwordHash: updateHash, role: user.role, createdAt: now };
    } else {
      const id = generateUid('usr');
      const stmt = this.db.prepare(
        "INSERT INTO users (id, username, full_name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      );
      stmt.run([id, user.username, user.fullName, finalHash, user.role, now]);
      stmt.free();
      this.notifyChange();
      return { id, username: user.username, fullName: user.fullName, passwordHash: finalHash, role: user.role, createdAt: now };
    }
  }

  public deleteUser(id: string): void {
    if (!this.db) return;
    const stmt = this.db.prepare("DELETE FROM users WHERE id = ?");
    stmt.run([id]);
    stmt.free();
    this.notifyChange();
  }

  // --- Audit Trail ---
  public getAuditTrail(): AuditRecord[] {
    if (!this.db) return [];
    try {
      const res = this.db.exec("SELECT id, timestamp, dt_display, user_name, action, entity_type, entity_name, details, signature_hash FROM audit_trail ORDER BY timestamp DESC LIMIT 2000;");
      if (!res.length) return [];
      return res[0].values.map(row => ({
        id: row[0] as string,
        timestamp: row[1] as number,
        dtDisplay: row[2] as string,
        user: row[3] as string,
        action: row[4] as any,
        entityType: row[5] as any,
        entityName: (row[6] as string) || '',
        details: (row[7] as string) || '',
        signatureHash: (row[8] as string) || undefined
      }));
    } catch (e) {
      console.error('getAuditTrail error:', e);
      return [];
    }
  }

  public addAudit(record: Omit<AuditRecord, 'id' | 'timestamp' | 'dtDisplay'>): void {
    if (!this.db) return;
    const now = Date.now();
    const id = generateUid('aud');
    const dtDisplay = fmtDT(now);
    const stmt = this.db.prepare(
      "INSERT INTO audit_trail (id, timestamp, dt_display, user_name, action, entity_type, entity_name, details, signature_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run([id, now, dtDisplay, record.user, record.action, record.entityType, record.entityName || null, record.details || null, record.signatureHash || null]);
    stmt.free();
    this.notifyChange();
  }

  public clearAuditTrail(): void {
    if (!this.db) return;
    this.db.run("DELETE FROM audit_trail;");
    this.notifyChange();
  }

  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  public reorderFields(orderedFields: LogField[]): void {
    if (!this.db) return;
    const stmt = this.db.prepare("UPDATE log_fields SET sort_order = ? WHERE id = ?;");
    orderedFields.forEach((f, idx) => {
      stmt.run([idx, f.id]);
    });
    stmt.free();
    this.notifyChange();
  }

  // ---------- Export / Import SQLite Binary File ----------
  public exportDatabaseBinary(): Uint8Array {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }

  public async importDatabaseBinary(binaryData: Uint8Array): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: () => sqlWasmUrl
    });
    const newDb = new SQL.Database(binaryData);
    // Verify valid SQLite structure
    newDb.exec("PRAGMA schema_version;");
    
    if (this.db) {
      this.db.close();
    }
    this.db = newDb;
    await this.saveToIndexedDB(binaryData);
    this.notifyChange();
  }

  public async resetToSeedData(): Promise<void> {
    if (!this.db) return;
    this.db.run(`
      DROP TABLE IF EXISTS log_entries;
      DROP TABLE IF EXISTS log_fields;
      DROP TABLE IF EXISTS equipment;
      DROP TABLE IF EXISTS audit_trail;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS db_metadata;
    `);
    this.bootstrapSchema();
    this.notifyChange();
  }
}

export const sqliteEngine = new SqliteEngine();
