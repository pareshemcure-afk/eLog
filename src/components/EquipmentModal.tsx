import React, { useState, useEffect } from 'react';
import { X, Cpu, Check, AlertCircle } from 'lucide-react';
import { Equipment } from '../types';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipmentData: Omit<Equipment, 'id'>, existingId?: string) => void;
  equipmentToEdit?: Equipment | null;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  equipmentToEdit
}) => {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'Active' | 'Maintenance' | 'Inactive'>('Active');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (equipmentToEdit) {
      setName(equipmentToEdit.name);
      setModel(equipmentToEdit.model || '');
      setSerialNo(equipmentToEdit.serialNo || '');
      setLocation(equipmentToEdit.location || '');
      setStatus(equipmentToEdit.status);
      setNotes(equipmentToEdit.notes || '');
    } else {
      setName('');
      setModel('');
      setSerialNo('');
      setLocation('');
      setStatus('Active');
      setNotes('');
    }
    setErrorMsg('');
  }, [equipmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Equipment Name is required.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        model: model.trim() || undefined,
        serialNo: serialNo.trim() || undefined,
        location: location.trim() || undefined,
        status,
        notes: notes.trim() || undefined
      },
      equipmentToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              <Cpu className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-serif italic">
                {equipmentToEdit ? 'Edit Equipment Unit' : 'Register New Equipment Unit'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">SQLite Table: equipment</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-300 font-mono">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Equipment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. HPLC System Agilent 1260"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Model / Make
              </label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. Infinity II"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNo}
                onChange={e => setSerialNo(e.target.value)}
                placeholder="e.g. DE64839210"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Location / Facility Room
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. QC Lab 302, Bench 4"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Operational Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-500 font-medium"
              >
                <option value="Active">Active (Available for logging)</option>
                <option value="Maintenance">Maintenance / Calibration</option>
                <option value="Inactive">Inactive / Retired</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Notes / Validation Details
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Calibration frequency, certified parameters, SOP references..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-serif italic"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#27272a] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 text-[10px] uppercase tracking-widest font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-[10px] font-bold uppercase tracking-widest rounded-lg transition shadow-sm"
            >
              {equipmentToEdit ? 'Save Changes' : 'Register Equipment'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
