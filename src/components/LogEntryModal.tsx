import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, ShieldCheck, User, AlertCircle, Sparkles } from 'lucide-react';
import { Equipment, LogEntry, LogField, Session } from '../types';
import { getCurrent24Time } from '../utils/dateTime';

interface LogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (logData: { equipmentId: string; values: Record<string, any> }, existingId?: string) => void;
  equipmentList: Equipment[];
  fields: LogField[];
  session: Session | null;
  entryToEdit?: LogEntry | null;
  presetEquipmentId?: string | null;
}

export const LogEntryModal: React.FC<LogEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  equipmentList,
  fields,
  session,
  entryToEdit,
  presetEquipmentId
}) => {
  const [equipmentId, setEquipmentId] = useState<string>('');
  const [values, setValues] = useState<Record<string, any>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const enabledFields = fields.filter(f => f.enabled).sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (entryToEdit) {
      setEquipmentId(entryToEdit.equipmentId);
      setValues({ ...entryToEdit.values });
    } else {
      const initialId = presetEquipmentId || (equipmentList.length > 0 ? equipmentList[0].id : '');
      setEquipmentId(initialId);

      const initialValues: Record<string, any> = {};
      const now24 = getCurrent24Time();

      enabledFields.forEach(f => {
        if (f.fieldKey === 'startTime') {
          initialValues[f.fieldKey] = now24;
        } else if (f.fieldKey === 'startUser') {
          initialValues[f.fieldKey] = session?.fullName || '';
        } else if (f.fieldKey === 'endTime') {
          initialValues[f.fieldKey] = '';
        } else if (f.fieldKey === 'endUser') {
          initialValues[f.fieldKey] = '';
        } else {
          initialValues[f.fieldKey] = '';
        }
      });

      setValues(initialValues);
    }
    setErrorMsg('');
  }, [entryToEdit, presetEquipmentId, equipmentList, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (fieldKey: string, val: any) => {
    setValues(prev => ({
      ...prev,
      [fieldKey]: val
    }));
  };

  const handleApplyCurrentTime = (fieldKey: string) => {
    handleInputChange(fieldKey, getCurrent24Time());
  };

  const handleApplySignature = (fieldKey: string) => {
    if (session) {
      handleInputChange(fieldKey, session.fullName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId) {
      setErrorMsg('Please select an equipment unit.');
      return;
    }

    // Validate required fields
    for (const f of enabledFields) {
      if (f.required && (!values[f.fieldKey] || String(values[f.fieldKey]).trim() === '')) {
        setErrorMsg(`Field "${f.name}" is required.`);
        return;
      }
    }

    onSave(
      {
        equipmentId,
        values
      },
      entryToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              <BookOpen className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-serif italic">
                {entryToEdit ? `Edit Log Entry #${entryToEdit.entryNo}` : 'Record Equipment Usage Entry'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">SQLite Table: log_entries &bull; 21 CFR Compliant</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-300 font-mono">
              {errorMsg}
            </div>
          )}

          {/* Equipment Unit Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Target Equipment Unit *
            </label>
            <select
              value={equipmentId}
              onChange={e => setEquipmentId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-semibold focus:outline-none focus:border-zinc-500"
            >
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.model || 'Standard'}) &bull; {eq.location || 'Facility'}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Fields Section */}
          <div className="space-y-3 pt-2">
            {enabledFields.map(f => {
              const val = values[f.fieldKey] ?? '';

              if (f.type === 'time') {
                return (
                  <div key={f.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                        {f.name} {f.required && '*'} (24-Hour Format)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleApplyCurrentTime(f.fieldKey)}
                        className="text-[10px] text-zinc-400 hover:text-white font-mono flex items-center gap-1 uppercase"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Now</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={val}
                      onChange={e => handleInputChange(f.fieldKey, e.target.value)}
                      placeholder="dd/mm/yy hh.mm (e.g. 18/08/26 14.30)"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                );
              }

              if (f.type === 'signature') {
                return (
                  <div key={f.id} className="space-y-1 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{f.name} {f.required && '*'} (Electronic Sign)</span>
                      </label>
                      {session && (
                        <button
                          type="button"
                          onClick={() => handleApplySignature(f.fieldKey)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold font-mono uppercase"
                        >
                          Sign as {session.fullName.split(' ')[0]}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={val}
                      onChange={e => handleInputChange(f.fieldKey, e.target.value)}
                      placeholder="Operator legal full signature name"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-300 font-semibold placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
                    />
                  </div>
                );
              }

              if (f.type === 'dropdown' && f.options && f.options.length > 0) {
                return (
                  <div key={f.id} className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      {f.name} {f.required && '*'}
                    </label>
                    <select
                      value={val}
                      onChange={e => handleInputChange(f.fieldKey, e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                    >
                      <option value="">-- Select {f.name} --</option>
                      {f.options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={f.id} className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                    {f.name} {f.required && '*'}
                  </label>
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={val}
                    onChange={e => handleInputChange(f.fieldKey, e.target.value)}
                    placeholder={`Enter ${f.name.toLowerCase()}...`}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
                  />
                </div>
              );
            })}
          </div>

          {/* Electronic Signature Attestation Notice */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[10px] text-zinc-500 leading-relaxed font-serif italic">
            By saving this log entry, you certify that all entered usage parameters, timestamps, and readings represent true, unmanipulated operational data under 21 CFR Part 11 electronic records regulations.
          </div>

          {/* Form Actions */}
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
              {entryToEdit ? 'Save Changes' : 'Commit & Sign Entry'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
