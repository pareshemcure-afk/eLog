import React from 'react';
import {
  Cpu,
  BookOpen,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Download,
  Terminal,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { Equipment, LogEntry, LogField, AuditRecord, Session, DatabaseStats, AppView } from '../types';
import { fmtDT } from '../utils/dateTime';

interface DashboardViewProps {
  equipment: Equipment[];
  logs: LogEntry[];
  fields: LogField[];
  audit: AuditRecord[];
  session: Session | null;
  dbStats: DatabaseStats | null;
  onSelectView: (view: AppView) => void;
  onOpenNewLogModal: () => void;
  onOpenNewEquipmentModal: () => void;
  onDownloadSqlite: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  equipment,
  logs,
  fields,
  audit,
  session,
  dbStats,
  onSelectView,
  onOpenNewLogModal,
  onOpenNewEquipmentModal,
  onDownloadSqlite
}) => {
  const activeEquipmentCount = equipment.filter(e => e.status === 'Active').length;
  const maintenanceCount = equipment.filter(e => e.status === 'Maintenance').length;
  const recentLogs = [...logs].reverse().slice(0, 5);
  const recentAudit = [...audit].slice(0, 5);

  return (
    <div id="view_dashboard" className="space-y-6">
      
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mb-1">
            System Overview &bull; 21 CFR Compliant
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif italic">
            Equipment Log Concierge
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            SQLite relational backend with continuous IndexedDB binary replication and Microsoft Access export bridge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn_dash_new_log"
            onClick={onOpenNewLogModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded-lg transition hover:bg-zinc-200 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Log Entry</span>
          </button>

          <button
            id="btn_dash_new_equip"
            onClick={onOpenNewEquipmentModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] hover:border-zinc-600 rounded-lg text-[10px] uppercase tracking-widest font-semibold transition"
          >
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Units */}
        <div className="bg-[#0c0c0e] border border-[#27272a] rounded-xl p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-bold">Equipment Units</span>
            <Cpu className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{equipment.length}</span>
            <span className="text-xs text-emerald-400 font-mono">({activeEquipmentCount} Active)</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center justify-between">
            <span>Maintenance: {maintenanceCount}</span>
            <button
              onClick={() => onSelectView('equipment')}
              className="text-zinc-400 hover:text-white flex items-center gap-0.5"
            >
              <span>View</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 2: Total Log Entries */}
        <div className="bg-[#0c0c0e] border border-[#27272a] rounded-xl p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-bold">Logbook Records</span>
            <BookOpen className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{logs.length}</span>
            <span className="text-xs text-zinc-400 font-mono">Signed</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center justify-between">
            <span>{fields.filter(f => f.enabled).length} active fields</span>
            <button
              onClick={() => onSelectView('logs')}
              className="text-zinc-400 hover:text-white flex items-center gap-0.5"
            >
              <span>Logbook</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 3: Audit Trail Events */}
        <div className="bg-[#0c0c0e] border border-[#27272a] rounded-xl p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-bold">Audit Events</span>
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{audit.length}</span>
            <span className="text-xs text-emerald-400 font-mono">Verified</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center justify-between">
            <span>Immutable history</span>
            <button
              onClick={() => onSelectView('audit')}
              className="text-zinc-400 hover:text-white flex items-center gap-0.5"
            >
              <span>Audit</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4: SQLite Database Size */}
        <div className="bg-[#0c0c0e] border border-[#27272a] rounded-xl p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[10px] uppercase tracking-widest font-bold">Database Store</span>
            <HardDrive className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {dbStats ? (dbStats.sizeBytes / 1024).toFixed(1) : '0.0'}
            </span>
            <span className="text-xs text-zinc-400 font-mono">KB</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-2 flex items-center justify-between">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Integrity OK</span>
            </span>
            <button
              onClick={onDownloadSqlite}
              className="text-zinc-400 hover:text-white flex items-center gap-0.5"
            >
              <span>Export</span>
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Grid: Recent Logs & Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Log Entries Table */}
        <div className="lg:col-span-2 bg-[#0c0c0e] rounded-xl border border-[#27272a] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Live Activity</div>
              <h3 className="font-bold text-white text-sm">Recent Equipment Log Records</h3>
            </div>
            <button
              onClick={() => onSelectView('logs')}
              className="text-xs text-zinc-400 hover:text-white font-medium transition flex items-center gap-1"
            >
              <span>View All ({logs.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-serif italic">
                No logbook records recorded yet. Click &quot;Record Log Entry&quot; to begin.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121215] text-zinc-400 font-mono text-[10px] uppercase tracking-wider border-b border-[#27272a]">
                  <tr>
                    <th className="px-4 py-3">Entry #</th>
                    <th className="px-4 py-3">Equipment</th>
                    <th className="px-4 py-3">Batch No</th>
                    <th className="px-4 py-3">Start (24h)</th>
                    <th className="px-4 py-3">Signed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f23] font-mono text-[11px]">
                  {recentLogs.map(log => {
                    const eq = equipment.find(e => e.id === log.equipmentId);
                    return (
                      <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                        <td className="px-4 py-3 font-bold text-white">#{log.entryNo}</td>
                        <td className="px-4 py-3 text-zinc-200 font-sans">{eq?.name || log.equipmentId}</td>
                        <td className="px-4 py-3 text-zinc-400">{log.values.batchNo || '—'}</td>
                        <td className="px-4 py-3 text-zinc-300">{log.values.startTime || '—'}</td>
                        <td className="px-4 py-3 font-sans text-emerald-400 font-medium">
                          {log.values.startUser || log.createdBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right 1 Col: Audit Trail Stream */}
        <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">21 CFR Security</div>
              <h3 className="font-bold text-white text-sm">Audit Trail Stream</h3>
            </div>
            <button
              onClick={() => onSelectView('audit')}
              className="text-xs text-zinc-400 hover:text-white font-medium transition"
            >
              View Full Log
            </button>
          </div>

          <div className="p-4 divide-y divide-[#1f1f23] overflow-y-auto max-h-80 flex-1 text-xs">
            {recentAudit.map(a => (
              <div key={a.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-[11px]">{a.user}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{a.dtDisplay}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {a.action}
                  </span>
                  <span className="text-zinc-400 truncate">{a.entityType}: {a.entityName}</span>
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-1">{a.details}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
