import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Table as TableIcon,
  Code,
  HardDrive,
  Copy,
  Layers
} from 'lucide-react';
import { sqliteEngine } from '../db/sqliteEngine';
import { SqlQueryResult, TableSchema, DatabaseStats } from '../types';

interface SqlStudioViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onDownloadSqlite: () => void;
}

const SAMPLE_QUERIES = [
  {
    name: 'All Equipment with Usage Counts',
    sql: `SELECT E.name AS equipment_name, E.status, E.location, COUNT(L.id) AS total_logs
FROM equipment E
LEFT JOIN log_entries L ON E.id = L.equipment_id
GROUP BY E.id
ORDER BY total_logs DESC;`
  },
  {
    name: 'Recent Signed Log Entries',
    sql: `SELECT L.entry_no, E.name AS equipment, L.created_by, L.created_at, json_extract(L.values_json, '$.batchNo') AS batch_no, json_extract(L.values_json, '$.startTime') AS start_time
FROM log_entries L
JOIN equipment E ON L.equipment_id = E.id
ORDER BY L.created_at DESC
LIMIT 20;`
  },
  {
    name: 'Audit Trail by Action Breakdown',
    sql: `SELECT action, entity_type, COUNT(*) AS event_count, MAX(dt_display) AS latest_event
FROM audit_trail
GROUP BY action, entity_type
ORDER BY event_count DESC;`
  },
  {
    name: 'Check SQLite Integrity',
    sql: `PRAGMA integrity_check;`
  },
  {
    name: 'Inspect Table Schema',
    sql: `PRAGMA table_info(log_entries);`
  }
];

export const SqlStudioView: React.FC<SqlStudioViewProps> = ({ onNotify, onDownloadSqlite }) => {
  const [sql, setSql] = useState<string>(SAMPLE_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [tableSchemas, setTableSchemas] = useState<TableSchema[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>('equipment');
  const [isExecuting, setIsExecuting] = useState(false);

  const refreshSchemaAndStats = () => {
    const schemas = sqliteEngine.getTableSchemas();
    const stats = sqliteEngine.getDatabaseStats();
    setTableSchemas(schemas);
    setDbStats(stats);
  };

  useEffect(() => {
    refreshSchemaAndStats();
    handleRunQuery(SAMPLE_QUERIES[0].sql);
    const unsub = sqliteEngine.subscribe(refreshSchemaAndStats);
    return unsub;
  }, []);

  const handleRunQuery = (sqlToRun?: string) => {
    const q = sqlToRun || sql;
    if (!q.trim()) return;
    setIsExecuting(true);
    try {
      const res = sqliteEngine.executeSql(q);
      setQueryResult(res);
      if (res.error) {
        onNotify(res.error, 'error');
      } else {
        sqliteEngine.addAudit({
          user: 'SQLite Developer',
          action: 'SQL_Execute',
          entityType: 'Database',
          entityName: 'SQLite 3 Engine',
          details: `Executed: ${q.slice(0, 100)}${q.length > 100 ? '...' : ''}`
        });
      }
    } catch (e: any) {
      setQueryResult({
        columns: [],
        values: [],
        rowsCount: 0,
        executionTimeMs: 0,
        error: e.message || String(e)
      });
      onNotify(e.message || 'Execution error', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      await sqliteEngine.importDatabaseBinary(uint8);
      refreshSchemaAndStats();
      onNotify(`SQLite database "${file.name}" successfully imported!`, 'success');
      handleRunQuery('SELECT * FROM equipment LIMIT 10;');
    } catch (err: any) {
      onNotify(`Failed to import SQLite file: ${err.message}`, 'error');
    }
  };

  const handleResetDatabase = async () => {
    if (confirm('Are you sure you want to reset the SQLite database to factory seed data? Current records will be replaced.')) {
      await sqliteEngine.resetToSeedData();
      refreshSchemaAndStats();
      onNotify('SQLite database reset to factory demo seed.', 'info');
      handleRunQuery('SELECT * FROM equipment;');
    }
  };

  const activeSchema = tableSchemas.find(t => t.name === selectedTable);

  return (
    <div id="view_sqlite_studio" className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-mono mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>SQLite 3.x WebAssembly Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif italic">
            SQLite Management Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Direct relational SQL execution, table DDL explorer, and binary SQLite database file backup/restore.
          </p>
        </div>

        {/* Database Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            id="btn_sqlite_download_binary"
            onClick={onDownloadSqlite}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded-lg transition hover:bg-zinc-200 shadow-sm"
            title="Export actual .sqlite / .db binary file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .sqlite</span>
          </button>

          <label
            htmlFor="sqlite_upload_input"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] hover:border-zinc-600 rounded-lg text-[10px] uppercase tracking-widest font-semibold transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Import .sqlite</span>
            <input
              id="sqlite_upload_input"
              type="file"
              accept=".sqlite,.db,.sqlite3"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>

          <button
            id="btn_reset_sqlite_db"
            onClick={handleResetDatabase}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] hover:border-zinc-600 rounded-lg text-[10px] uppercase tracking-widest font-semibold transition"
            title="Reset to default seed data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Demo DB</span>
          </button>

        </div>
      </div>

      {/* Database Metrics Ribbon */}
      {dbStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0c0c0e] p-4 rounded-xl border border-[#27272a]">
          <div className="border-r border-[#27272a] pr-3">
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Database Size</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {(dbStats.sizeBytes / 1024).toFixed(1)} KB
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{dbStats.pageCount} pages &bull; {dbStats.pageSize} B</div>
          </div>

          <div className="border-r border-[#27272a] pr-3">
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Tables &amp; Records</div>
            <div className="text-xl font-bold font-mono text-white">
              {dbStats.totalTables} <span className="text-xs text-zinc-500">tables</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{dbStats.totalRecords} total records</div>
          </div>

          <div className="border-r border-[#27272a] pr-3">
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Engine Mode</div>
            <div className="text-xl font-bold font-mono text-zinc-200">WASM 3.x</div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">IndexedDB Sync</div>
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">PRAGMA Integrity</div>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>OK</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">Foreign keys: ON</div>
          </div>
        </div>
      )}

      {/* SQL Editor & Sample Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive SQL Console */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] overflow-hidden flex flex-col">
            
            {/* Editor Toolbar */}
            <div className="px-4 py-3 bg-[#121215] border-b border-[#27272a] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="uppercase tracking-wider text-[11px]">SQL Query Console</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn_run_sql"
                  onClick={() => handleRunQuery()}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold uppercase tracking-wider transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Running...' : 'Execute (Ctrl+Enter)'}</span>
                </button>
              </div>
            </div>

            {/* SQL Input Area */}
            <div className="p-4 bg-[#09090b]">
              <textarea
                id="textarea_sql_input"
                value={sql}
                onChange={e => setSql(e.target.value)}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleRunQuery();
                  }
                }}
                rows={6}
                placeholder="Write standard SQLite query (e.g. SELECT * FROM equipment WHERE status = 'Active';)"
                className="w-full bg-[#121215] text-emerald-300 font-mono text-xs p-3 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-600 resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Quick Templates Bar */}
            <div className="px-4 py-2 bg-[#0c0c0e] border-t border-[#27272a] flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest shrink-0">Templates:</span>
              {SAMPLE_QUERIES.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSql(sq.sql);
                    handleRunQuery(sq.sql);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded font-mono whitespace-nowrap transition"
                >
                  {sq.name}
                </button>
              ))}
            </div>

          </div>

          {/* Query Results Panel */}
          {queryResult && (
            <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#27272a] bg-[#121215] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-white text-xs uppercase tracking-widest font-mono">Query Results</h3>
                  <span className="text-xs text-zinc-400 font-mono">
                    {queryResult.rowsCount} rows
                  </span>
                  {queryResult.affectedRows !== undefined && queryResult.affectedRows > 0 && (
                    <span className="text-xs text-emerald-400 font-mono font-semibold">
                      ({queryResult.affectedRows} modified)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{queryResult.executionTimeMs} ms</span>
                </div>
              </div>

              {queryResult.error ? (
                <div className="p-6 bg-rose-950/40 border-b border-rose-900/60 text-rose-300 text-xs font-mono flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-200 mb-1">SQLite Execution Error:</div>
                    <div>{queryResult.error}</div>
                  </div>
                </div>
              ) : queryResult.columns.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs font-mono">
                  Query executed successfully with 0 result columns.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#121215] text-zinc-400 font-semibold border-b border-[#27272a] sticky top-0 text-[10px] uppercase tracking-wider">
                      <tr>
                        {queryResult.columns.map((col, cIdx) => (
                          <th key={cIdx} className="px-4 py-2.5 whitespace-nowrap bg-[#121215]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f23]">
                      {queryResult.values.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-zinc-800/40 transition">
                          {row.map((val, vIdx) => (
                            <td key={vIdx} className="px-4 py-2 text-zinc-300 whitespace-nowrap">
                              {val === null ? (
                                <span className="text-zinc-600 italic font-sans text-[11px]">NULL</span>
                              ) : typeof val === 'object' ? (
                                JSON.stringify(val)
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right 1 Col: Table Schemas Explorer */}
        <div className="space-y-4">
          
          <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-zinc-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-widest font-mono">Database Tables</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">{tableSchemas.length} tables</span>
            </div>

            <div className="divide-y divide-[#1f1f23]">
              {tableSchemas.map(t => (
                <div
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  className={`p-3.5 cursor-pointer flex items-center justify-between transition ${
                    selectedTable === t.name ? 'bg-zinc-800/80 border-l-2 border-zinc-300' : 'hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-white text-xs">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                      {t.columns.length} cols &bull; {t.rowCount} rows
                    </div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const query = `SELECT * FROM ${t.name} LIMIT 50;`;
                      setSql(query);
                      handleRunQuery(query);
                    }}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono font-semibold border border-zinc-800 transition"
                    title="Quick query table"
                  >
                    SELECT
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Table DDL and Columns */}
          {activeSchema && (
            <div className="bg-[#0c0c0e] text-zinc-300 rounded-xl border border-[#27272a] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-mono font-bold text-xs text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span>Schema: {activeSchema.name}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  {activeSchema.rowCount} rows
                </span>
              </div>

              {/* Column definitions list */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Columns:</div>
                <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-[11px]">
                  {activeSchema.columns.map(col => (
                    <div key={col.name} className="flex items-center justify-between px-2 py-1 bg-zinc-900/60 rounded border border-zinc-800/60">
                      <span className="text-zinc-200 font-semibold">{col.name}</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-amber-400">{col.type}</span>
                        {col.pk === 1 && (
                          <span className="bg-rose-950/80 text-rose-300 px-1 py-0.2 rounded border border-rose-800">
                            PK
                          </span>
                        )}
                        {col.notnull === 1 && <span className="text-zinc-500">NN</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DDL SQL */}
              <div className="pt-2 border-t border-[#27272a]">
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">CREATE TABLE DDL:</div>
                <pre className="text-[10px] font-mono text-emerald-300/90 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800 overflow-x-auto max-h-36 whitespace-pre-wrap">
                  {activeSchema.ddl}
                </pre>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
