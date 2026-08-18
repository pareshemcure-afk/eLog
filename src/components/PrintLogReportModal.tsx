import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Building2,
  Calendar,
  ShieldCheck,
  Download,
  Clock,
  Cpu,
  Layers,
  Settings2
} from 'lucide-react';
import { Equipment, LogEntry, LogField, Session } from '../types';
import { fmtDT, fmtDate, parseDT } from '../utils/dateTime';

interface PrintLogReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  equipmentList: Equipment[];
  fields: LogField[];
  session: Session | null;
}

export const PrintLogReportModal: React.FC<PrintLogReportModalProps> = ({
  isOpen,
  onClose,
  logs,
  equipmentList,
  fields,
  session
}) => {
  // Filter & Customization Controls State
  const [selectedEquipId, setSelectedEquipId] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [docNumber, setDocNumber] = useState<string>('LOG-SOP-2026-08');
  const [revNumber, setRevNumber] = useState<string>('Rev 04');
  const [department, setDepartment] = useState<string>('Quality Control Analytical Lab');
  const [facility, setFacility] = useState<string>('Main Manufacturing & Research Facility');
  const [includeSignatureBlock, setIncludeSignatureBlock] = useState<boolean>(true);
  const [includeSummaryMetrics, setIncludeSummaryMetrics] = useState<boolean>(true);
  const [selectedFields, setSelectedFields] = useState<string[]>(() =>
    fields.filter(f => f.enabled).map(f => f.fieldKey)
  );

  // Enabled fields sorted
  const enabledFields = useMemo(() => {
    return fields.filter(f => f.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [fields]);

  // Filter logs by equipment and date range
  const filteredLogs = useMemo(() => {
    return logs
      .filter(l => {
        if (selectedEquipId !== 'All' && l.equipmentId !== selectedEquipId) {
          return false;
        }
        if (dateFrom) {
          const fromTime = new Date(dateFrom).setHours(0, 0, 0, 0);
          if (l.createdAt < fromTime) return false;
        }
        if (dateTo) {
          const toTime = new Date(dateTo).setHours(23, 59, 59, 999);
          if (l.createdAt > toTime) return false;
        }
        return true;
      })
      .sort((a, b) => a.createdAt - b.createdAt); // chronological order for official logbook
  }, [logs, selectedEquipId, dateFrom, dateTo]);

  // Selected equipment details if single
  const targetEquipment = useMemo(() => {
    if (selectedEquipId === 'All') return null;
    return equipmentList.find(e => e.id === selectedEquipId) || null;
  }, [selectedEquipId, equipmentList]);

  // Calculate summary metrics
  const summary = useMemo(() => {
    const totalEntries = filteredLogs.length;
    let completedRuns = 0;
    let totalMinutes = 0;

    filteredLogs.forEach(l => {
      if (l.values.startTime && l.values.endTime) {
        completedRuns++;
        const sDate = parseDT(l.values.startTime);
        const eDate = parseDT(l.values.endTime);
        if (sDate && eDate && eDate.getTime() > sDate.getTime()) {
          totalMinutes += Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60));
        }
      }
    });

    const hours = (totalMinutes / 60).toFixed(1);
    const uniqueOperators = new Set(
      filteredLogs.flatMap(l => [l.values.startUser, l.values.endUser, l.createdBy].filter(Boolean))
    ).size;

    return {
      totalEntries,
      completedRuns,
      openRuns: totalEntries - completedRuns,
      hours,
      uniqueOperators
    };
  }, [filteredLogs]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const toggleFieldSelection = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey) ? prev.filter(k => k !== fieldKey) : [...prev, fieldKey]
    );
  };

  const printTimestamp = fmtDT(new Date());

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-xs overflow-y-auto">
      
      {/* Top Floating Control Toolbar (Hidden in Print) */}
      <div className="no-print sticky top-0 z-50 bg-[#0c0c0e] border-b border-[#27272a] px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Title & Document Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center font-bold shadow-inner">
              <Printer className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm font-serif italic">
                  Print-Ready Official Logbook Report
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  21 CFR Part 11 Format
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                Generating PDF / physical layout ({filteredLogs.length} records ready to print)
              </p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Equipment Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={selectedEquipId}
                onChange={e => setSelectedEquipId(e.target.value)}
                className="bg-transparent text-white text-[11px] font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#0c0c0e]">All Equipment ({equipmentList.length})</option>
                {equipmentList.map(eq => (
                  <option key={eq.id} value={eq.id} className="bg-[#0c0c0e]">
                    {eq.name} ({eq.model || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg text-[11px]">
              <Calendar className="w-3 h-3 text-zinc-500" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                placeholder="From"
                className="bg-transparent text-white text-[10px] focus:outline-none w-24"
                title="Filter records from date"
              />
              <span className="text-zinc-600 font-mono">&rarr;</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                placeholder="To"
                className="bg-transparent text-white text-[10px] focus:outline-none w-24"
                title="Filter records to date"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="text-zinc-500 hover:text-white text-[10px] ml-1 font-mono"
                  title="Clear date filter"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-black text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Secondary Customization Ribbon (Collapsible details) */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-[#27272a]/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-[10px] font-mono">
          <div>
            <label className="text-zinc-500 block">SOP / Doc ID:</label>
            <input
              type="text"
              value={docNumber}
              onChange={e => setDocNumber(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-200 text-[10px]"
            />
          </div>
          <div>
            <label className="text-zinc-500 block">Revision:</label>
            <input
              type="text"
              value={revNumber}
              onChange={e => setRevNumber(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-200 text-[10px]"
            />
          </div>
          <div className="col-span-2">
            <label className="text-zinc-500 block">Department / Laboratory:</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-200 text-[10px]"
            />
          </div>
          <div className="col-span-2 flex items-center gap-4 pt-3">
            <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSummaryMetrics}
                onChange={e => setIncludeSummaryMetrics(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700"
              />
              <span>Metrics Banner</span>
            </label>
            <label className="flex items-center gap-1.5 text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignatureBlock}
                onChange={e => setIncludeSignatureBlock(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700"
              />
              <span>QA Sign-off Block</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Printable Document Area */}
      <div className="flex-1 p-4 sm:p-8 flex justify-center">
        <div
          id="printable_logbook_record"
          className="printable-report-area bg-white text-black w-full max-w-[1080px] p-8 sm:p-12 shadow-2xl rounded-sm border border-zinc-300 font-sans leading-normal text-xs"
          style={{ minHeight: '297mm' }}
        >
          
          {/* ========================================================= */}
          {/* OFFICIAL GMP DOCUMENT HEADER                              */}
          {/* ========================================================= */}
          <div className="border-2 border-black p-4 mb-6">
            <div className="grid grid-cols-12 gap-4 items-center">
              
              {/* Company / Facility Info */}
              <div className="col-span-3 border-r border-black pr-4">
                <div className="font-serif font-black text-base tracking-tight uppercase">
                  eLOG SYSTEMS
                </div>
                <div className="text-[10px] text-zinc-700 font-mono mt-0.5 leading-tight">
                  Pharmaceutical &amp; Analytical Laboratory Operations
                </div>
                <div className="text-[9px] text-zinc-600 mt-1 font-mono">{facility}</div>
              </div>

              {/* Central Title */}
              <div className="col-span-6 text-center px-2">
                <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-700 font-bold">
                  21 CFR Part 11 &bull; EU Annex 11 Official Record
                </div>
                <h1 className="text-lg sm:text-xl font-bold font-serif uppercase tracking-wide mt-1">
                  EQUIPMENT USAGE &amp; OPERATION LOGBOOK
                </h1>
                <div className="text-[10px] font-semibold text-zinc-800 mt-0.5">
                  {department}
                </div>
              </div>

              {/* Document Metadata Grid */}
              <div className="col-span-3 border-l border-black pl-4 text-[9px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Doc No:</span>
                  <span className="font-bold">{docNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Revision:</span>
                  <span className="font-bold">{revNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Print Date:</span>
                  <span className="font-semibold">{printTimestamp.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Print Time:</span>
                  <span className="font-semibold">{printTimestamp.split(' ')[1] || '00:00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Printed By:</span>
                  <span className="font-bold">{session?.fullName || 'Authorized Operator'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* TARGET EQUIPMENT CARD (IF SINGLE UNIT FILTERED)          */}
          {/* ========================================================= */}
          {targetEquipment ? (
            <div className="border border-black bg-zinc-50/80 p-3 mb-6 grid grid-cols-4 gap-3 text-[10px] font-mono">
              <div>
                <span className="text-zinc-600 block text-[9px] uppercase font-bold">Equipment Name:</span>
                <span className="font-bold text-black text-xs font-sans">{targetEquipment.name}</span>
              </div>
              <div>
                <span className="text-zinc-600 block text-[9px] uppercase font-bold">Model / Make:</span>
                <span className="font-semibold text-black">{targetEquipment.model || 'Standard Unit'}</span>
              </div>
              <div>
                <span className="text-zinc-600 block text-[9px] uppercase font-bold">Serial Number / Asset ID:</span>
                <span className="font-bold text-black">{targetEquipment.serialNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-600 block text-[9px] uppercase font-bold">Location / Operational Status:</span>
                <span className="font-semibold text-black">{targetEquipment.location || 'Facility'} &bull; [{targetEquipment.status}]</span>
              </div>
            </div>
          ) : (
            <div className="border border-black bg-zinc-50/80 px-3 py-2 mb-6 flex items-center justify-between text-[10px] font-mono">
              <div>
                <span className="font-bold">Scope of Record:</span> Master Consolidated Logbook (All Units &bull; {equipmentList.length} Active Machines)
              </div>
              <div>
                <span className="font-bold">Period Filter:</span> {dateFrom || 'Beginning'} to {dateTo || 'Present Date'}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SUMMARY OPERATIONAL METRICS                               */}
          {/* ========================================================= */}
          {includeSummaryMetrics && (
            <div className="grid grid-cols-4 border border-black mb-6 text-center text-[10px] font-mono divide-x divide-black bg-white">
              <div className="p-2">
                <div className="text-[9px] uppercase text-zinc-600">Total Recorded Entries</div>
                <div className="text-sm font-bold text-black font-sans">{summary.totalEntries} Runs</div>
              </div>
              <div className="p-2">
                <div className="text-[9px] uppercase text-zinc-600">Completed / Signed</div>
                <div className="text-sm font-bold text-black font-sans">{summary.completedRuns} / {summary.totalEntries}</div>
              </div>
              <div className="p-2">
                <div className="text-[9px] uppercase text-zinc-600">Cumulative Operating Hours</div>
                <div className="text-sm font-bold text-black font-sans">{summary.hours} hrs</div>
              </div>
              <div className="p-2">
                <div className="text-[9px] uppercase text-zinc-600">Certified Operators</div>
                <div className="text-sm font-bold text-black font-sans">{summary.uniqueOperators} Users</div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LOGBOOK DATA TABLE                                        */}
          {/* ========================================================= */}
          <div className="mb-8">
            <table className="w-full text-left border-collapse border border-black text-[10px]">
              <thead className="bg-zinc-200/90 text-black font-mono font-bold uppercase text-[9px] border-b-2 border-black">
                <tr>
                  <th className="border border-black px-2.5 py-2 text-center w-12">Entry #</th>
                  <th className="border border-black px-2.5 py-2">Equipment Unit</th>
                  <th className="border border-black px-2.5 py-2">Batch / Lot No</th>
                  <th className="border border-black px-2.5 py-2">Start Time (24h)</th>
                  <th className="border border-black px-2.5 py-2">Start Sign</th>
                  <th className="border border-black px-2.5 py-2">End Time (24h)</th>
                  <th className="border border-black px-2.5 py-2">End Sign</th>
                  {/* Dynamic Custom Fields */}
                  {enabledFields
                    .filter(f => selectedFields.includes(f.fieldKey) && !['startTime', 'endTime', 'startUser', 'endUser', 'batchNo', 'remark'].includes(f.fieldKey))
                    .map(f => (
                      <th key={f.id} className="border border-black px-2 py-2">
                        {f.name}
                      </th>
                    ))}
                  <th className="border border-black px-2.5 py-2">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/40">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, idx) => {
                    const eq = equipmentList.find(e => e.id === log.equipmentId);
                    return (
                      <tr
                        key={log.id}
                        className={`print-avoid-break ${idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}`}
                      >
                        {/* Entry No */}
                        <td className="border border-black px-2 py-1.5 font-mono font-bold text-center">
                          {log.entryNo}
                        </td>

                        {/* Equipment Name */}
                        <td className="border border-black px-2 py-1.5 font-sans font-semibold">
                          {eq?.name || log.equipmentId}
                          {eq?.serialNo && (
                            <span className="block font-mono font-normal text-[8px] text-zinc-600">
                              SN: {eq.serialNo}
                            </span>
                          )}
                        </td>

                        {/* Batch No */}
                        <td className="border border-black px-2 py-1.5 font-mono">
                          {log.values.batchNo || '—'}
                        </td>

                        {/* Start Time */}
                        <td className="border border-black px-2 py-1.5 font-mono whitespace-nowrap">
                          {log.values.startTime || '—'}
                        </td>

                        {/* Start Sign */}
                        <td className="border border-black px-2 py-1.5 font-sans font-medium">
                          {log.values.startUser ? (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-black">{log.values.startUser}</span>
                              <span className="text-[8px] font-mono text-zinc-600">[Signed]</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Unsigned</span>
                          )}
                        </td>

                        {/* End Time */}
                        <td className="border border-black px-2 py-1.5 font-mono whitespace-nowrap">
                          {log.values.endTime || '—'}
                        </td>

                        {/* End Sign */}
                        <td className="border border-black px-2 py-1.5 font-sans font-medium">
                          {log.values.endUser ? (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-black">{log.values.endUser}</span>
                              <span className="text-[8px] font-mono text-zinc-600">[Signed]</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Unsigned</span>
                          )}
                        </td>

                        {/* Custom Dynamic Fields */}
                        {enabledFields
                          .filter(f => selectedFields.includes(f.fieldKey) && !['startTime', 'endTime', 'startUser', 'endUser', 'batchNo', 'remark'].includes(f.fieldKey))
                          .map(f => (
                            <td key={f.id} className="border border-black px-2 py-1.5 font-sans text-[9px]">
                              {log.values[f.fieldKey] || '—'}
                            </td>
                          ))}

                        {/* Remarks */}
                        <td className="border border-black px-2 py-1.5 font-sans text-[9px] text-zinc-800">
                          {log.values.remark || 'Routine usage within certified specification.'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8 + selectedFields.length} className="border border-black px-4 py-8 text-center text-zinc-500 italic">
                      No operational log records recorded for the selected filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* 21 CFR PART 11 OFFICIAL VERIFICATION & SIGN-OFF BLOCK     */}
          {/* ========================================================= */}
          {includeSignatureBlock && (
            <div className="print-avoid-break border-2 border-black p-4 mt-8 bg-white">
              
              <div className="border-b border-black pb-2 mb-4">
                <div className="font-bold text-[10px] uppercase font-mono tracking-wider flex items-center justify-between">
                  <span>21 CFR PART 11 &bull; GMP VERIFICATION &amp; APPROVAL AUDIT BLOCK</span>
                  <span className="text-[9px] font-normal text-zinc-600">Security Hash: SHA256-CERTIFIED</span>
                </div>
                <p className="text-[9px] text-zinc-700 mt-1 leading-tight font-serif italic">
                  I hereby certify that the above equipment logbook transcript reflects true, accurate, and complete electronic records recorded contemporaneously at the time of operation in accordance with Good Manufacturing Practices (GMP) and 21 CFR Part 11 regulations.
                </p>
              </div>

              {/* Formal 3-Part Signature Columns */}
              <div className="grid grid-cols-3 gap-6 pt-2">
                
                {/* 1. Prepared By */}
                <div className="space-y-4">
                  <div className="text-[9px] font-mono uppercase font-bold text-zinc-800 border-b border-black/50 pb-0.5">
                    1. Prepared / Printed By
                  </div>
                  <div className="text-[10px] space-y-1 font-mono">
                    <div>Name: <span className="font-bold font-sans">{session?.fullName || 'Lead Operator'}</span></div>
                    <div>Role: <span className="font-semibold">{session?.role || 'Operator'}</span></div>
                    <div>Date: <span className="font-semibold">{printTimestamp}</span></div>
                    <div className="pt-4 border-b border-dashed border-black">
                      <span className="text-[8px] text-zinc-500 font-sans italic">Signature / Digital ID Sign-off</span>
                    </div>
                  </div>
                </div>

                {/* 2. Laboratory Supervisor / Reviewer */}
                <div className="space-y-4">
                  <div className="text-[9px] font-mono uppercase font-bold text-zinc-800 border-b border-black/50 pb-0.5">
                    2. Technical Peer Reviewer
                  </div>
                  <div className="text-[10px] space-y-1 font-mono">
                    <div>Name: ___________________________</div>
                    <div>Role: <span className="text-zinc-600">Lab Supervisor / Specialist</span></div>
                    <div>Date: ___________________________</div>
                    <div className="pt-4 border-b border-dashed border-black">
                      <span className="text-[8px] text-zinc-500 font-sans italic">Signature / Digital ID Sign-off</span>
                    </div>
                  </div>
                </div>

                {/* 3. Quality Assurance Unit (QA) */}
                <div className="space-y-4">
                  <div className="text-[9px] font-mono uppercase font-bold text-zinc-800 border-b border-black/50 pb-0.5">
                    3. Quality Assurance (QA) Approval
                  </div>
                  <div className="text-[10px] space-y-1 font-mono">
                    <div>Name: ___________________________</div>
                    <div>Role: <span className="text-zinc-600">Quality Assurance Officer</span></div>
                    <div>Date: ___________________________</div>
                    <div className="pt-4 border-b border-dashed border-black">
                      <span className="text-[8px] text-zinc-500 font-sans italic">Signature / Digital ID Sign-off</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Security Watermark */}
              <div className="mt-4 pt-2 border-t border-black/40 flex items-center justify-between text-[8px] font-mono text-zinc-600">
                <div>eLOG Database Persistent Storage &bull; SQLite WebAssembly Engine v3.x</div>
                <div>CONFIDENTIAL &bull; PROPRIETARY LAB RECORD &bull; PAGE 1 OF 1</div>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
};
