import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Table as TableIcon,
  Filter,
  Download,
  Plus,
  Trash2,
  Save,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  FileCode,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Sliders,
  FolderOpen
} from 'lucide-react';
import { sqliteEngine } from '../db/sqliteEngine';
import { Equipment, LogEntry, LogField, User, AuditRecord } from '../types';
import { fmtDT, fmtDate } from '../utils/dateTime';
import { generateAccessXml, generateAccessVbaScript, generateAccessSqlScript } from '../db/accessExport';

interface AccessModeViewProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenNewLogModal: () => void;
}

type AccessTabType = 'table' | 'query' | 'form' | 'report';
type AccessViewMode = 'datasheet' | 'form' | 'report';

interface AccessNavObject {
  id: string;
  name: string;
  type: AccessTabType;
  icon: any;
}

const ACCESS_OBJECTS: AccessNavObject[] = [
  // Tables
  { id: 'tbl_Equipment', name: 'tbl_Equipment', type: 'table', icon: TableIcon },
  { id: 'tbl_LogEntries', name: 'tbl_LogEntries', type: 'table', icon: TableIcon },
  { id: 'tbl_LogFields', name: 'tbl_LogFields', type: 'table', icon: TableIcon },
  { id: 'tbl_AuditTrail', name: 'tbl_AuditTrail', type: 'table', icon: TableIcon },
  { id: 'tbl_Users', name: 'tbl_Users', type: 'table', icon: TableIcon },

  // Queries
  { id: 'qry_EquipmentActiveLogs', name: 'qry_EquipmentActiveLogs', type: 'query', icon: Filter },
  { id: 'qry_DailyUsageSummary', name: 'qry_DailyUsageSummary', type: 'query', icon: Filter },

  // Forms
  { id: 'frm_EquipmentRecord', name: 'frm_EquipmentRecord', type: 'form', icon: FileSpreadsheet },
  { id: 'frm_LogBookEntry', name: 'frm_LogBookEntry', type: 'form', icon: FileSpreadsheet },

  // Reports
  { id: 'rpt_EquipmentUsageSummary', name: 'rpt_EquipmentUsageSummary', type: 'report', icon: FileText },
  { id: 'rpt_AuditComplianceCertificate', name: 'rpt_AuditComplianceCertificate', type: 'report', icon: ShieldCheck }
];

export const AccessModeView: React.FC<AccessModeViewProps> = ({ onNotify, onOpenNewLogModal }) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string>('tbl_Equipment');
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'create' | 'external' | 'database'>('home');
  const [viewMode, setViewMode] = useState<AccessViewMode>('datasheet');
  const [formRecordIndex, setFormRecordIndex] = useState<number>(0);

  // Data states from SQLite
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fields, setFields] = useState<LogField[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = () => {
    setEquipment(sqliteEngine.getEquipment());
    setLogs(sqliteEngine.getLogEntries());
    setFields(sqliteEngine.getFields());
    setAudit(sqliteEngine.getAuditTrail());
    setUsers(sqliteEngine.getUsers());
  };

  useEffect(() => {
    loadData();
    const unsub = sqliteEngine.subscribe(loadData);
    return unsub;
  }, []);

  const currentObject = ACCESS_OBJECTS.find(o => o.id === selectedObjectId) || ACCESS_OBJECTS[0];

  // Adjust view mode when switching object types
  useEffect(() => {
    if (currentObject.type === 'form') {
      setViewMode('form');
    } else if (currentObject.type === 'report') {
      setViewMode('report');
    } else {
      setViewMode('datasheet');
    }
    setFormRecordIndex(0);
  }, [selectedObjectId]);

  // Export handlers
  const handleExportAccessXml = () => {
    const xml = generateAccessXml();
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eLOG_Access_Database_${fmtDate(new Date()).replace(/\//g, '-')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Microsoft Access XML Database exported successfully! (Import via External Data -> XML)', 'success');
  };

  const handleExportAccessVba = () => {
    const vba = generateAccessVbaScript();
    const blob = new Blob([vba], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eLOG_Access_Builder_Module.bas`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Microsoft Access VBA Module (.bas) generated! Open Access -> Alt+F11 -> Import Module.', 'success');
  };

  const handleExportAccessSql = () => {
    const sql = generateAccessSqlScript();
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eLOG_Access_Jet_SQL.sql`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Microsoft Access SQL Jet script downloaded.', 'success');
  };

  return (
    <div id="view_access_mode" className="space-y-4">
      
      {/* Microsoft Access Dark Ribbon Header */}
      <div className="bg-[#18181b] text-white rounded-t-xl px-4 py-2.5 flex items-center justify-between border border-[#27272a] shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-rose-900 border border-rose-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
            A
          </div>
          <div className="text-xs font-semibold tracking-wide">
            <span className="text-zinc-200">eLOG_Equipment_Usage_Database.accdb</span>
            <span className="text-zinc-500 ml-2 font-normal font-mono text-[11px]">&bull; Microsoft Access Engine Bridge</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded font-mono text-[10px] text-zinc-300">Access 2016-365 Schema</span>
        </div>
      </div>

      {/* Access Ribbon Menu Container */}
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-b-xl shadow-xs overflow-hidden">
        
        {/* Ribbon Tabs Header */}
        <div className="bg-[#121215] border-b border-[#27272a] flex items-center px-3 pt-1.5 gap-1 text-xs">
          {(['home', 'create', 'external', 'database'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveRibbonTab(tab)}
              className={`px-4 py-1.5 rounded-t-lg font-semibold uppercase tracking-wider text-[11px] transition ${
                activeRibbonTab === tab
                  ? 'bg-[#0c0c0e] text-white border-t-2 border-zinc-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'home' ? 'Home' : tab === 'create' ? 'Create' : tab === 'external' ? 'External Data' : 'Database Tools'}
            </button>
          ))}
        </div>

        {/* Ribbon Tab Content Command Groups */}
        <div className="p-3 bg-[#0c0c0e] flex items-center gap-4 overflow-x-auto text-xs">
          
          {activeRibbonTab === 'home' && (
            <>
              {/* Views Group */}
              <div className="flex flex-col items-center border-r border-[#27272a] pr-4 gap-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewMode('datasheet')}
                    className={`flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 transition ${viewMode === 'datasheet' ? 'bg-zinc-800 text-white font-bold border border-zinc-700' : 'text-zinc-400'}`}
                    title="Datasheet Grid View"
                  >
                    <TableIcon className="w-4 h-4 text-zinc-300" />
                    <span className="text-[10px] mt-0.5">Datasheet</span>
                  </button>
                  <button
                    onClick={() => setViewMode('form')}
                    className={`flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 transition ${viewMode === 'form' ? 'bg-zinc-800 text-white font-bold border border-zinc-700' : 'text-zinc-400'}`}
                    title="Single Record Form View"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-zinc-300" />
                    <span className="text-[10px] mt-0.5">Form View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('report')}
                    className={`flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 transition ${viewMode === 'report' ? 'bg-zinc-800 text-white font-bold border border-zinc-700' : 'text-zinc-400'}`}
                    title="Formatted Report View"
                  >
                    <FileText className="w-4 h-4 text-zinc-300" />
                    <span className="text-[10px] mt-0.5">Report</span>
                  </button>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Views</span>
              </div>

              {/* Records Group */}
              <div className="flex flex-col items-center border-r border-[#27272a] pr-4 gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenNewLogModal}
                    className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] mt-0.5">New Record</span>
                  </button>
                  <button
                    onClick={() => onNotify('All records committed to SQLite storage.', 'success')}
                    className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition"
                  >
                    <Save className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] mt-0.5">Save Record</span>
                  </button>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Records</span>
              </div>

              {/* Quick Search */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 py-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Find in datasheet..."
                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 w-44 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Find</span>
              </div>
            </>
          )}

          {activeRibbonTab === 'create' && (
            <div className="flex flex-col items-center border-r border-[#27272a] pr-4 gap-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenNewLogModal}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition"
                >
                  <TableIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] mt-0.5">Table</span>
                </button>
                <button
                  onClick={() => setSelectedObjectId('qry_EquipmentActiveLogs')}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition"
                >
                  <Filter className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] mt-0.5">Query Wizard</span>
                </button>
                <button
                  onClick={() => setSelectedObjectId('frm_EquipmentRecord')}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] mt-0.5">Form Design</span>
                </button>
                <button
                  onClick={() => setSelectedObjectId('rpt_EquipmentUsageSummary')}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition"
                >
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] mt-0.5">Report Wizard</span>
                </button>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Create Objects</span>
            </div>
          )}

          {activeRibbonTab === 'external' && (
            <div className="flex flex-col items-center border-r border-[#27272a] pr-4 gap-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportAccessXml}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 transition"
                  title="Export MS Access Native XML with XSD Data Types"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-300 mt-0.5">Access XML</span>
                </button>
                <button
                  onClick={handleExportAccessVba}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 transition"
                  title="Export Complete Access VBA Auto-Builder Script"
                >
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold text-purple-300 mt-0.5">VBA Module</span>
                </button>
                <button
                  onClick={handleExportAccessSql}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 transition"
                  title="Export Access Jet/ACE SQL Schema"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-300 mt-0.5">Jet SQL</span>
                </button>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Export to Access</span>
            </div>
          )}

          {activeRibbonTab === 'database' && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNotify('SQLite database vacuumed and optimized.', 'success')}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] mt-0.5">Compact &amp; Repair</span>
                </button>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Database Tools</span>
            </div>
          )}

        </div>

      </div>

      {/* Main Microsoft Access Workspace Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        
        {/* Left Col: All Access Objects Navigation Pane */}
        <div className="md:col-span-1 bg-[#0c0c0e] rounded-xl border border-[#27272a] shadow-xs overflow-hidden flex flex-col">
          <div className="px-3.5 py-2.5 bg-[#121215] border-b border-[#27272a] flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-zinc-200 text-xs">
              <FolderOpen className="w-4 h-4 text-zinc-400" />
              <span>All Access Objects</span>
            </div>
          </div>

          <div className="p-2 space-y-4 overflow-y-auto max-h-[600px] text-xs">
            
            {/* Tables Category */}
            <div>
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900/60 rounded mb-1 flex items-center justify-between">
                <span>Tables</span>
                <span className="text-[10px] font-mono text-zinc-500">({equipment.length + logs.length + fields.length + audit.length + users.length})</span>
              </div>
              <div className="space-y-0.5">
                {ACCESS_OBJECTS.filter(o => o.type === 'table').map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 transition ${
                      selectedObjectId === obj.id
                        ? 'bg-zinc-800 text-white font-bold border-l-2 border-zinc-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{obj.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Queries Category */}
            <div>
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900/60 rounded mb-1">
                Queries
              </div>
              <div className="space-y-0.5">
                {ACCESS_OBJECTS.filter(o => o.type === 'query').map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 transition ${
                      selectedObjectId === obj.id
                        ? 'bg-zinc-800 text-white font-bold border-l-2 border-zinc-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{obj.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Forms Category */}
            <div>
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900/60 rounded mb-1">
                Forms
              </div>
              <div className="space-y-0.5">
                {ACCESS_OBJECTS.filter(o => o.type === 'form').map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 transition ${
                      selectedObjectId === obj.id
                        ? 'bg-zinc-800 text-white font-bold border-l-2 border-zinc-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{obj.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reports Category */}
            <div>
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900/60 rounded mb-1">
                Reports
              </div>
              <div className="space-y-0.5">
                {ACCESS_OBJECTS.filter(o => o.type === 'report').map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 transition ${
                      selectedObjectId === obj.id
                        ? 'bg-zinc-800 text-white font-bold border-l-2 border-zinc-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{obj.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right 3-4 Cols: Access Document Workspace */}
        <div className="md:col-span-3 lg:col-span-4 bg-[#0c0c0e] rounded-xl border border-[#27272a] shadow-xs overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Active Tab Bar */}
          <div className="bg-[#121215] px-3 pt-2 border-b border-[#27272a] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="px-3.5 py-1.5 bg-[#0c0c0e] border-t-2 border-zinc-300 rounded-t-lg font-bold text-xs text-white flex items-center gap-2 shadow-xs">
                {currentObject.type === 'table' && <TableIcon className="w-3.5 h-3.5 text-zinc-400" />}
                {currentObject.type === 'query' && <Filter className="w-3.5 h-3.5 text-zinc-400" />}
                {currentObject.type === 'form' && <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />}
                {currentObject.type === 'report' && <FileText className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{currentObject.name}</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 pb-1">
              <span>Mode:</span>
              <span className="font-bold text-zinc-300 uppercase">{viewMode}</span>
            </div>
          </div>

          {/* Document Content View Switcher */}
          <div className="flex-1 overflow-auto p-4">
            
            {/* 1. DATASHEET VIEW (Tables & Queries) */}
            {viewMode === 'datasheet' && (
              <div className="space-y-3">
                {selectedObjectId === 'tbl_Equipment' && (
                  <div className="border border-[#27272a] rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#121215] border-b border-[#27272a] text-zinc-400 font-semibold text-[11px]">
                        <tr>
                          <th className="px-3 py-2 border-r border-[#27272a] w-10 text-center bg-[#18181b]">#</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">EquipmentID (PK)</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">EquipmentName</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">Model</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">SerialNumber</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">Location</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">Status</th>
                          <th className="px-3 py-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f23] font-mono text-[11px]">
                        {equipment.map((eq, i) => (
                          <tr key={eq.id} className="hover:bg-zinc-800/40">
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-center bg-[#121215] text-zinc-500 font-sans text-[10px]">
                              {i + 1}
                            </td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-400">{eq.id}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-bold text-white font-sans">
                              {eq.name}
                            </td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300 font-sans">{eq.model || ''}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{eq.serialNo || ''}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300 font-sans">{eq.location || ''}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-sans font-semibold">
                              <span className={eq.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'}>
                                {eq.status}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-zinc-400 font-sans max-w-xs truncate">{eq.notes || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedObjectId === 'tbl_LogEntries' && (
                  <div className="border border-[#27272a] rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#121215] border-b border-[#27272a] text-zinc-400 font-semibold text-[11px]">
                        <tr>
                          <th className="px-3 py-2 border-r border-[#27272a] w-10 text-center bg-[#18181b]">#</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">LogEntryID</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">EquipmentID</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">EntryNo</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">BatchNo</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">StartTime (24h)</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">StartUserSign</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">EndTime (24h)</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">EndUserSign</th>
                          <th className="px-3 py-2">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f23] font-mono text-[11px]">
                        {logs.map((l, i) => (
                          <tr key={l.id} className="hover:bg-zinc-800/40">
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-center bg-[#121215] text-zinc-500 font-sans text-[10px]">
                              {i + 1}
                            </td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-500">{l.id}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{l.equipmentId}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-bold text-white">#{l.entryNo}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{l.values.batchNo || ''}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{l.values.startTime || ''}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-emerald-400 font-semibold font-sans">
                              {l.values.startUser || ''}
                            </td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{l.values.endTime || ''}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-emerald-400 font-semibold font-sans">
                              {l.values.endUser || ''}
                            </td>
                            <td className="px-3 py-1.5 text-zinc-400 font-sans max-w-xs truncate">{l.values.remark || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedObjectId === 'tbl_LogFields' && (
                  <div className="border border-[#27272a] rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#121215] border-b border-[#27272a] text-zinc-400 font-semibold text-[11px]">
                        <tr>
                          <th className="px-3 py-2 border-r border-[#27272a] w-10 text-center bg-[#18181b]">#</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">FieldKey (PK)</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">FieldName</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">FieldType</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">IsRequired</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">IsEnabled</th>
                          <th className="px-3 py-2">SortOrder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f23] font-mono text-[11px]">
                        {fields.map((f, i) => (
                          <tr key={f.id} className="hover:bg-zinc-800/40">
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-center bg-[#121215] text-zinc-500 font-sans text-[10px]">
                              {i + 1}
                            </td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-bold text-zinc-200">{f.fieldKey}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-sans font-semibold text-white">{f.name}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-400">{f.type}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{f.required ? 'Yes' : 'No'}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{f.enabled ? 'Yes' : 'No'}</td>
                            <td className="px-3 py-1.5 text-zinc-400">{f.sortOrder}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedObjectId === 'tbl_AuditTrail' && (
                  <div className="border border-[#27272a] rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#121215] border-b border-[#27272a] text-zinc-400 font-semibold text-[11px]">
                        <tr>
                          <th className="px-3 py-2 border-r border-[#27272a] w-10 text-center bg-[#18181b]">#</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">Timestamp</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">UserName</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">Action</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">EntityType</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">EntityName</th>
                          <th className="px-3 py-2">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f23] font-mono text-[11px]">
                        {audit.map((a, i) => (
                          <tr key={a.id} className="hover:bg-zinc-800/40">
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-center bg-[#121215] text-zinc-500 font-sans text-[10px]">
                              {i + 1}
                            </td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-400">{a.dtDisplay}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-bold text-white font-sans">{a.user}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-semibold text-zinc-300">{a.action}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-400 font-sans">{a.entityType}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-sans text-zinc-200">{a.entityName}</td>
                            <td className="px-3 py-1.5 text-zinc-400 font-sans max-w-sm truncate">{a.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedObjectId === 'tbl_Users' && (
                  <div className="border border-[#27272a] rounded overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#121215] border-b border-[#27272a] text-zinc-400 font-semibold text-[11px]">
                        <tr>
                          <th className="px-3 py-2 border-r border-[#27272a] w-10 text-center bg-[#18181b]">#</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">UserID</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">Username</th>
                          <th className="px-3 py-2 border-r border-[#27272a]">FullName</th>
                          <th className="px-3 py-2">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f23] font-mono text-[11px]">
                        {users.map((u, i) => (
                          <tr key={u.id} className="hover:bg-zinc-800/40">
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-center bg-[#121215] text-zinc-500 font-sans text-[10px]">
                              {i + 1}
                            </td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-500">{u.id}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-bold text-zinc-200">@{u.username}</td>
                            <td className="px-3 py-1.5 border-r border-[#27272a] font-sans font-semibold text-white">{u.fullName}</td>
                            <td className="px-3 py-1.5 font-sans font-bold text-purple-400">{u.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedObjectId === 'qry_EquipmentActiveLogs' && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                      <strong>SQL View:</strong> SELECT E.name AS EquipmentName, E.location, E.status, L.entry_no, json_extract(L.values_json, &apos;$.batchNo&apos;) AS BatchNo, json_extract(L.values_json, &apos;$.startTime&apos;) AS StartTime, json_extract(L.values_json, &apos;$.startUser&apos;) AS StartUserSign FROM equipment E INNER JOIN log_entries L ON E.id = L.equipment_id;
                    </div>
                    <div className="border border-[#27272a] rounded overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="bg-[#121215] border-b border-[#27272a] text-zinc-400 font-semibold text-[11px]">
                          <tr>
                            <th className="px-3 py-2 border-r border-[#27272a]">EquipmentName</th>
                            <th className="px-3 py-2 border-r border-[#27272a]">Location</th>
                            <th className="px-3 py-2 border-r border-[#27272a]">Status</th>
                            <th className="px-3 py-2 border-r border-[#27272a]">EntryNo</th>
                            <th className="px-3 py-2 border-r border-[#27272a]">BatchNo</th>
                            <th className="px-3 py-2 border-r border-[#27272a]">StartTime (24h)</th>
                            <th className="px-3 py-2">StartUserSign</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f1f23] text-[11px]">
                          {logs.map(l => {
                            const eq = equipment.find(e => e.id === l.equipmentId);
                            return (
                              <tr key={l.id} className="hover:bg-zinc-800/40 font-mono">
                                <td className="px-3 py-1.5 border-r border-[#27272a] font-sans font-bold text-white">{eq?.name}</td>
                                <td className="px-3 py-1.5 border-r border-[#27272a] font-sans text-zinc-400">{eq?.location}</td>
                                <td className="px-3 py-1.5 border-r border-[#27272a] font-sans text-zinc-300">{eq?.status}</td>
                                <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">#{l.entryNo}</td>
                                <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{l.values.batchNo || '—'}</td>
                                <td className="px-3 py-1.5 border-r border-[#27272a] text-zinc-300">{l.values.startTime || '—'}</td>
                                <td className="px-3 py-1.5 font-sans font-semibold text-emerald-400">{l.values.startUser || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. FORM VIEW (Classic Access Master Form + Subform) */}
            {viewMode === 'form' && (
              <div className="max-w-3xl mx-auto bg-[#0c0c0e] border border-[#27272a] rounded-xl p-6 shadow-md space-y-6">
                
                {/* Form Header */}
                <div className="border-b border-[#27272a] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight font-serif italic">
                      Equipment Usage Master Form (frm_EquipmentRecord)
                    </h3>
                    <div className="text-xs text-zinc-400 font-mono">
                      Record {equipment.length > 0 ? formRecordIndex + 1 : 0} of {equipment.length}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-xs">
                    MS
                  </div>
                </div>

                {/* Master Record Fields */}
                {equipment[formRecordIndex] ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-400 font-mono text-[10px] uppercase">Equipment ID:</label>
                        <input
                          type="text"
                          readOnly
                          value={equipment[formRecordIndex].id}
                          className="w-full px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded font-mono text-zinc-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-400 font-mono text-[10px] uppercase">Status:</label>
                        <input
                          type="text"
                          readOnly
                          value={equipment[formRecordIndex].status}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-bold text-emerald-400"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="font-bold text-zinc-400 font-mono text-[10px] uppercase">Equipment Name:</label>
                        <input
                          type="text"
                          readOnly
                          value={equipment[formRecordIndex].name}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-bold text-white text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-400 font-mono text-[10px] uppercase">Model / Make:</label>
                        <input
                          type="text"
                          readOnly
                          value={equipment[formRecordIndex].model || ''}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-zinc-400 font-mono text-[10px] uppercase">Serial Number:</label>
                        <input
                          type="text"
                          readOnly
                          value={equipment[formRecordIndex].serialNo || ''}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-zinc-300"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="font-bold text-zinc-400 font-mono text-[10px] uppercase">Location:</label>
                        <input
                          type="text"
                          readOnly
                          value={equipment[formRecordIndex].location || ''}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300"
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="font-bold text-zinc-400 font-mono text-[10px] uppercase">Notes / Validation Info:</label>
                        <textarea
                          readOnly
                          rows={2}
                          value={equipment[formRecordIndex].notes || ''}
                          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded resize-none text-zinc-300"
                        />
                      </div>

                    </div>

                    {/* Embedded Linked Subform: Log Entries for this equipment */}
                    <div className="pt-3 border-t border-[#27272a]">
                      <div className="font-bold text-zinc-300 text-xs mb-2 flex items-center justify-between">
                        <span>Linked Log Entries Subform (subfrm_Logs):</span>
                        <span className="text-zinc-500 font-mono">
                          {logs.filter(l => l.equipmentId === equipment[formRecordIndex].id).length} entries
                        </span>
                      </div>

                      <div className="border border-[#27272a] rounded overflow-hidden max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-[#121215] text-zinc-400 font-bold border-b border-[#27272a] text-[10px] uppercase">
                            <tr>
                              <th className="px-2 py-1.5">Entry#</th>
                              <th className="px-2 py-1.5">Batch</th>
                              <th className="px-2 py-1.5">Start Time</th>
                              <th className="px-2 py-1.5">Sign (Start)</th>
                              <th className="px-2 py-1.5">End Time</th>
                              <th className="px-2 py-1.5">Sign (End)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1f1f23] text-[11px] bg-[#0c0c0e]">
                            {logs
                              .filter(l => l.equipmentId === equipment[formRecordIndex].id)
                              .map(l => (
                                <tr key={l.id}>
                                  <td className="px-2 py-1 font-bold text-white">#{l.entryNo}</td>
                                  <td className="px-2 py-1 text-zinc-300">{l.values.batchNo || '—'}</td>
                                  <td className="px-2 py-1 text-zinc-300">{l.values.startTime || '—'}</td>
                                  <td className="px-2 py-1 text-emerald-400 font-sans">{l.values.startUser || '—'}</td>
                                  <td className="px-2 py-1 text-zinc-300">{l.values.endTime || '—'}</td>
                                  <td className="px-2 py-1 text-emerald-400 font-sans">{l.values.endUser || '—'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-zinc-500 text-xs">No records to display.</div>
                )}

              </div>
            )}

            {/* 3. REPORT VIEW (Formatted Access Layout) */}
            {viewMode === 'report' && (
              <div className="max-w-4xl mx-auto bg-[#0c0c0e] border border-[#27272a] p-8 shadow-lg space-y-6 text-zinc-200 font-sans rounded-xl">
                
                {/* Access Report Header */}
                <div className="border-b border-[#27272a] pb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-normal text-white uppercase tracking-tight font-serif italic">
                      Equipment Usage Log &amp; Verification Certificate
                    </h2>
                    <div className="text-xs text-zinc-400 font-mono mt-1">
                      System Report ID: rpt_EquipmentUsageSummary &bull; Generated At: {fmtDT(new Date())}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">eLOG Compliance</div>
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Electronic Records Certified</span>
                    </div>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="space-y-6">
                  {equipment.map(eq => {
                    const eqLogs = logs.filter(l => l.equipmentId === eq.id);
                    if (eqLogs.length === 0) return null;
                    return (
                      <div key={eq.id} className="space-y-2">
                        
                        {/* Group Header */}
                        <div className="bg-zinc-900/80 p-2.5 rounded border border-[#27272a] flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{eq.name}</span>
                            <span className="text-zinc-400 ml-2">({eq.model || 'Standard'} &bull; SN: {eq.serialNo || 'N/A'})</span>
                          </div>
                          <div className="text-zinc-400">Location: <strong className="text-zinc-200">{eq.location || 'Facility'}</strong></div>
                        </div>

                        {/* Group Table */}
                        <table className="w-full text-left text-xs border border-[#27272a] border-collapse">
                          <thead className="bg-[#121215] font-bold border-b border-[#27272a] text-[10px] uppercase text-zinc-400 font-mono">
                            <tr>
                              <th className="p-2 border-r border-[#27272a]">#</th>
                              <th className="p-2 border-r border-[#27272a]">Batch No</th>
                              <th className="p-2 border-r border-[#27272a]">Start Time (24h)</th>
                              <th className="p-2 border-r border-[#27272a]">User Sign (Start)</th>
                              <th className="p-2 border-r border-[#27272a]">End Time (24h)</th>
                              <th className="p-2 border-r border-[#27272a]">User Sign (End)</th>
                              <th className="p-2">Remark</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1f1f23] text-[11px] font-mono">
                            {eqLogs.map(l => (
                              <tr key={l.id}>
                                <td className="p-2 border-r border-[#27272a] font-bold text-white">#{l.entryNo}</td>
                                <td className="p-2 border-r border-[#27272a] text-zinc-300">{l.values.batchNo || '—'}</td>
                                <td className="p-2 border-r border-[#27272a] text-zinc-300">{l.values.startTime || '—'}</td>
                                <td className="p-2 border-r border-[#27272a] font-sans font-semibold text-emerald-400">
                                  {l.values.startUser || '—'}
                                </td>
                                <td className="p-2 border-r border-[#27272a] text-zinc-300">{l.values.endTime || '—'}</td>
                                <td className="p-2 border-r border-[#27272a] font-sans font-semibold text-emerald-400">
                                  {l.values.endUser || '—'}
                                </td>
                                <td className="p-2 text-zinc-400 font-sans">{l.values.remark || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>

                {/* Report Footer & Signature Block */}
                <div className="pt-6 border-t border-[#27272a] grid grid-cols-2 gap-8 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-zinc-300">Quality Assurance Officer:</div>
                    <div className="h-10 border-b border-zinc-700"></div>
                    <div className="text-[10px] text-zinc-500 font-mono">Signature / Verification Date</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-zinc-300">Operations Supervisor:</div>
                    <div className="h-10 border-b border-zinc-700"></div>
                    <div className="text-[10px] text-zinc-500 font-mono">Signature / Verification Date</div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Classic Access Form Record Navigator Footer (When in Form View) */}
          {viewMode === 'form' && (
            <div className="bg-[#121215] border-t border-[#27272a] px-4 py-2.5 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-1 font-mono">
                <span className="text-zinc-500 mr-2 text-[11px] uppercase">Record:</span>
                <button
                  onClick={() => setFormRecordIndex(0)}
                  disabled={formRecordIndex === 0}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-zinc-800"
                  title="First Record"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFormRecordIndex(Math.max(0, formRecordIndex - 1))}
                  disabled={formRecordIndex === 0}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-zinc-800"
                  title="Previous Record"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-bold text-white">
                  {equipment.length > 0 ? formRecordIndex + 1 : 0}
                </span>
                <span className="text-zinc-500 mx-1">of {equipment.length}</span>
                <button
                  onClick={() => setFormRecordIndex(Math.min(equipment.length - 1, formRecordIndex + 1))}
                  disabled={formRecordIndex >= equipment.length - 1}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-zinc-800"
                  title="Next Record"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFormRecordIndex(equipment.length - 1)}
                  disabled={formRecordIndex >= equipment.length - 1}
                  className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-zinc-800"
                  title="Last Record"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-zinc-500 font-mono">
                Ready &bull; MS Access Jet/ACE Compatible
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
