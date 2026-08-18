import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  Shield,
  FileText,
  User,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { AuditRecord } from '../types';
import { fmtDT } from '../utils/dateTime';

interface AuditTrailViewProps {
  audit: AuditRecord[];
  onExportCsv: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ audit, onExportCsv }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');

  const filteredAudit = audit.filter(a => {
    const matchesAction = actionFilter === 'All' || a.action === actionFilter;
    const matchesSearch =
      a.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.dtDisplay.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAction && matchesSearch;
  });

  const actions = ['All', 'Add', 'Edit', 'Delete', 'Login', 'Register', 'SQL_Execute'];

  return (
    <div id="view_audit_trail" className="space-y-6">
      
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mb-1">
            21 CFR Part 11 Compliance &bull; SQLite Table audit_trail
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif italic">
            Audit Trail &amp; Electronic Integrity
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable time-stamped log of every record creation, modification, deletion, and raw SQL query execution.
          </p>
        </div>

        <button
          onClick={onExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] hover:border-zinc-600 rounded-lg text-[10px] uppercase tracking-widest font-semibold transition self-start sm:self-auto"
          title="Export complete audit trail log"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0c0c0e] p-3 rounded-xl border border-[#27272a]">
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by operator, action, entity, timestamp, or details..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 font-sans"
          />
        </div>

        {/* Action Filter Pills */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 overflow-x-auto">
          {actions.map(act => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider transition ${
                actionFilter === act
                  ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

      </div>

      {/* Audit Trail Table */}
      <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#121215] text-zinc-400 font-mono text-[10px] uppercase tracking-wider border-b border-[#27272a]">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Entity</th>
                <th className="px-4 py-3.5">Name / Identifier</th>
                <th className="px-4 py-3.5">Modification Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] font-mono text-[11px]">
              {filteredAudit.map(a => (
                <tr key={a.id} className="hover:bg-zinc-800/40 transition">
                  
                  {/* Timestamp */}
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                    {a.dtDisplay}
                  </td>

                  {/* User */}
                  <td className="px-4 py-3 font-sans font-semibold text-white whitespace-nowrap">
                    {a.user}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        a.action === 'Add' || a.action === 'Register'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          : a.action === 'Edit'
                          ? 'bg-blue-950/60 text-blue-400 border-blue-800/60'
                          : a.action === 'Delete'
                          ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                          : a.action === 'SQL_Execute'
                          ? 'bg-purple-950/60 text-purple-400 border-purple-800/60'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {a.action}
                    </span>
                  </td>

                  {/* Entity Type */}
                  <td className="px-4 py-3 text-zinc-400 font-sans whitespace-nowrap">
                    {a.entityType}
                  </td>

                  {/* Entity Name */}
                  <td className="px-4 py-3 text-zinc-200 whitespace-nowrap">
                    {a.entityName}
                  </td>

                  {/* Details */}
                  <td className="px-4 py-3 text-zinc-400 font-sans max-w-md truncate">
                    {a.details}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAudit.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-serif italic">
            No audit records matching the specified filter criteria.
          </div>
        )}
      </div>

    </div>
  );
};
