import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  BookOpen,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Equipment, LogEntry, Session } from '../types';
import { fmtDT } from '../utils/dateTime';

interface EquipmentViewProps {
  equipment: Equipment[];
  logs: LogEntry[];
  session: Session | null;
  onOpenAddModal: () => void;
  onOpenEditModal: (equipment: Equipment) => void;
  onDeleteEquipment: (id: string, name: string) => void;
  onOpenLogModalForEquipment: (equipmentId: string) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  equipment,
  logs,
  session,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteEquipment,
  onOpenLogModalForEquipment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Maintenance' | 'Inactive'>('All');

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.model && eq.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (eq.serialNo && eq.serialNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (eq.location && eq.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="view_equipment" className="space-y-6">
      
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mb-1">
            Registered Relational Units
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif italic">
            Equipment Registry
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage instrumentation inventory, calibration locations, and operational statuses.
          </p>
        </div>

        <button
          id="btn_add_equipment"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded-lg transition hover:bg-zinc-200 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Equipment Unit</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0c0c0e] p-3 rounded-xl border border-[#27272a]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by equipment name, model, serial no, or location..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 font-sans"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 overflow-x-auto">
          {(['All', 'Active', 'Maintenance', 'Inactive'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition ${
                statusFilter === st
                  ? 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(eq => {
          const eqLogs = logs.filter(l => l.equipmentId === eq.id);
          const lastLog = eqLogs[eqLogs.length - 1];

          return (
            <div
              key={eq.id}
              className="bg-[#0c0c0e] rounded-xl border border-[#27272a] hover:border-zinc-700 p-5 flex flex-col justify-between transition group"
            >
              <div className="space-y-3">
                
                {/* Status & Actions Header */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold border ${
                      eq.status === 'Active'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : eq.status === 'Maintenance'
                        ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        eq.status === 'Active' ? 'bg-emerald-400' : eq.status === 'Maintenance' ? 'bg-amber-400' : 'bg-zinc-500'
                      }`}
                    ></span>
                    <span>{eq.status}</span>
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onOpenEditModal(eq)}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded transition"
                      title="Edit Unit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEquipment(eq.id, eq.name)}
                      className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded transition"
                      title="Delete Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Name & ID */}
                <div>
                  <h3 className="font-bold text-white text-base leading-snug group-hover:text-zinc-100 transition">
                    {eq.name}
                  </h3>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    ID: {eq.id} &bull; Model: {eq.model || 'Standard'}
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-1 text-xs text-zinc-400 pt-1">
                  {eq.serialNo && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="font-mono text-zinc-300">SN: {eq.serialNo}</span>
                    </div>
                  )}
                  {eq.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{eq.location}</span>
                    </div>
                  )}
                </div>

                {/* Notes if present */}
                {eq.notes && (
                  <p className="text-[11px] text-zinc-400 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80 line-clamp-2 font-serif italic">
                    {eq.notes}
                  </p>
                )}

              </div>

              {/* Card Footer: Logbook summary & Action button */}
              <div className="pt-4 border-t border-[#27272a] mt-4 flex items-center justify-between">
                <div className="text-[11px] text-zinc-400 font-mono">
                  <span className="font-bold text-white">{eqLogs.length}</span> log records
                </div>

                <button
                  onClick={() => onOpenLogModalForEquipment(eq.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-500 rounded-lg text-xs font-semibold transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Log Usage</span>
                </button>
              </div>

            </div>
          );
        })}

        {filteredEquipment.length === 0 && (
          <div className="col-span-full p-12 text-center bg-[#0c0c0e] rounded-xl border border-[#27272a] text-zinc-500 space-y-2">
            <Cpu className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-sm font-semibold text-zinc-300">No equipment units matched your query</div>
            <p className="text-xs font-serif italic">Try searching with a different term or register a new unit.</p>
          </div>
        )}
      </div>

    </div>
  );
};
