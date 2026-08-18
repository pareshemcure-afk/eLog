import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  ShieldCheck,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { Equipment, LogEntry, LogField, Session } from '../types';
import { fmtDT, fmtDate } from '../utils/dateTime';
import { PrintLogReportModal } from './PrintLogReportModal';

interface LogBookViewProps {
  logs: LogEntry[];
  equipmentList: Equipment[];
  fields: LogField[];
  session: Session | null;
  onOpenNewLogModal: () => void;
  onOpenEditLogModal: (entry: LogEntry) => void;
  onDeleteLog: (id: string, entryNo: string) => void;
  onExportCsv: () => void;
}

export const LogBookView: React.FC<LogBookViewProps> = ({
  logs,
  equipmentList,
  fields,
  session,
  onOpenNewLogModal,
  onOpenEditLogModal,
  onDeleteLog,
  onExportCsv
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('All');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const enabledFields = fields.filter(f => f.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  const filteredLogs = logs.filter(log => {
    const eq = equipmentList.find(e => e.id === log.equipmentId);
    const equipName = eq?.name || '';
    const matchEquip = selectedEquipmentId === 'All' || log.equipmentId === selectedEquipmentId;

    const valuesStr = Object.values(log.values).join(' ').toLowerCase();
    const matchSearch =
      log.entryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      valuesStr.includes(searchTerm.toLowerCase());

    return matchEquip && matchSearch;
  });

  return (
    <div id="view_logbook" className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mb-1">
            21 CFR Part 11 Electronic Records
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif italic">
            Equipment Logbook
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Complete sequential log records with electronic signature authentication and 24-hour timestamps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Friendly View Button */}
          <button
            id="btn_print_logbook"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] hover:border-zinc-600 rounded-lg text-[10px] uppercase tracking-widest font-semibold transition"
            title="Open Print-Friendly PDF Report View"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Print Report</span>
          </button>

          {/* Export CSV Button */}
          <button
            id="btn_export_csv"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] hover:border-zinc-600 rounded-lg text-[10px] uppercase tracking-widest font-semibold transition"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          {/* New Log Entry Button */}
          <button
            id="btn_add_log_entry"
            onClick={onOpenNewLogModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded-lg transition hover:bg-zinc-200 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Log Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0c0c0e] p-3 rounded-xl border border-[#27272a]">
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by entry #, batch #, operator, remark, or equipment..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 font-sans"
          />
        </div>

        {/* Equipment Selector Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-mono hidden sm:inline uppercase tracking-wider">Unit:</span>
          <select
            value={selectedEquipmentId}
            onChange={e => setSelectedEquipmentId(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-medium focus:outline-none focus:border-zinc-500"
          >
            <option value="All">All Equipment Units ({equipmentList.length})</option>
            {equipmentList.map(eq => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Log Entries Data Table */}
      <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#121215] text-zinc-400 font-mono text-[10px] uppercase tracking-wider border-b border-[#27272a]">
              <tr>
                <th className="px-4 py-3.5">Entry #</th>
                <th className="px-4 py-3.5">Equipment</th>
                <th className="px-4 py-3.5">Batch No</th>
                <th className="px-4 py-3.5">Start Time (24h)</th>
                <th className="px-4 py-3.5">Sign (Start)</th>
                <th className="px-4 py-3.5">End Time (24h)</th>
                <th className="px-4 py-3.5">Sign (End)</th>
                <th className="px-4 py-3.5">Remark</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] font-mono text-[11px]">
              {filteredLogs.map(log => {
                const eq = equipmentList.find(e => e.id === log.equipmentId);
                return (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition group">
                    
                    {/* Entry Number */}
                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                      #{log.entryNo}
                    </td>

                    {/* Equipment Name */}
                    <td className="px-4 py-3 font-sans font-medium text-zinc-200 whitespace-nowrap">
                      {eq?.name || log.equipmentId}
                    </td>

                    {/* Batch Number */}
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      {log.values.batchNo || <span className="text-zinc-600">—</span>}
                    </td>

                    {/* Start Time */}
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      {log.values.startTime || <span className="text-zinc-600">—</span>}
                    </td>

                    {/* Start Signature */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.values.startUser ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{log.values.startUser}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-sans">Unsigned</span>
                      )}
                    </td>

                    {/* End Time */}
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      {log.values.endTime || <span className="text-zinc-600">—</span>}
                    </td>

                    {/* End Signature */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.values.endUser ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{log.values.endUser}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-sans">Unsigned</span>
                      )}
                    </td>

                    {/* Remark */}
                    <td className="px-4 py-3 font-sans text-zinc-400 max-w-xs truncate">
                      {log.values.remark || '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onOpenEditLogModal(log)}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition"
                          title="Edit Log Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteLog(log.id, log.entryNo)}
                          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition"
                          title="Delete Log Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-zinc-500 space-y-2 font-serif italic">
            <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-sm font-semibold text-zinc-300">No log entries found</div>
            <p className="text-xs">Adjust your search query or record a new log entry.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <div>Showing {filteredLogs.length} of {logs.length} total records</div>
        <div>21 CFR Part 11 Electronic Signatures Certified</div>
      </div>

      {/* Print Friendly Logbook Report Modal */}
      <PrintLogReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        logs={logs}
        equipmentList={equipmentList}
        fields={fields}
        session={session}
      />

    </div>
  );
};
