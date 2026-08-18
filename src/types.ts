export type FieldType = 'text' | 'number' | 'date' | 'time' | 'select' | 'sign' | 'dropdown' | 'signature';
export type LogFieldType = FieldType;
export type EquipmentStatus = 'Active' | 'Inactive' | 'Maintenance';
export type UserRole = 'Admin' | 'Operator';
export type AppMode = 'standard' | 'access' | 'sqlite_studio';
export type AppView = 'dashboard' | 'equipment' | 'logs' | 'fields' | 'audit' | 'users';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  createdAt: number;
}

export interface Session {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  loginAt: number;
}

export interface Equipment {
  id: string;
  name: string;
  model?: string;
  serialNo?: string;
  location?: string;
  status: EquipmentStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LogField {
  id: string;
  fieldKey: string;
  name: string;
  type: FieldType;
  required: boolean;
  enabled: boolean;
  system: boolean;
  sortOrder: number;
  options?: string[];
}

export interface LogEntry {
  id: string;
  equipmentId: string;
  entryNo: string;
  values: Record<string, string>;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuditRecord {
  id: string;
  timestamp: number;
  dtDisplay: string;
  user: string;
  action: 'Add' | 'Edit' | 'Delete' | 'Login' | 'Register' | 'Logout' | 'Export' | 'Clear' | 'Customize' | 'SQL_Execute' | 'DB_Restore';
  entityType: 'Equipment' | 'Log Entry' | 'Field' | 'User' | 'Database' | 'Session' | 'Audit Trail';
  entityName: string;
  details: string;
  signatureHash?: string;
}

export interface SqlQueryResult {
  columns: string[];
  values: any[][];
  rowsCount: number;
  executionTimeMs: number;
  affectedRows?: number;
  error?: string;
}

export interface TableSchema {
  name: string;
  columns: {
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }[];
  rowCount: number;
  ddl: string;
}

export interface DatabaseStats {
  pageSize: number;
  pageCount: number;
  sizeBytes: number;
  totalTables: number;
  totalRecords: number;
  integrityOk: boolean;
  lastSync: number;
}
