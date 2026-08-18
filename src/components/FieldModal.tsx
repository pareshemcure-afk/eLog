import React, { useState, useEffect } from 'react';
import { X, Sliders, AlertCircle } from 'lucide-react';
import { LogField, LogFieldType } from '../types';

interface FieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fieldData: Omit<LogField, 'id'>, existingId?: string) => void;
  fieldToEdit?: LogField | null;
}

export const FieldModal: React.FC<FieldModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fieldToEdit
}) => {
  const [name, setName] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [type, setType] = useState<LogFieldType>('text');
  const [required, setRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (fieldToEdit) {
      setName(fieldToEdit.name);
      setFieldKey(fieldToEdit.fieldKey);
      setType(fieldToEdit.type);
      setRequired(fieldToEdit.required);
      setOptionsStr(fieldToEdit.options ? fieldToEdit.options.join(', ') : '');
    } else {
      setName('');
      setFieldKey('');
      setType('text');
      setRequired(false);
      setOptionsStr('');
    }
    setErrorMsg('');
  }, [fieldToEdit, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!fieldToEdit) {
      // Auto-generate camelCase key
      const key = val
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
        .replace(/[^a-zA-Z0-9]/g, '');
      setFieldKey(key);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fieldKey.trim()) {
      setErrorMsg('Field Name and Key are required.');
      return;
    }

    const options =
      type === 'dropdown'
        ? optionsStr
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : undefined;

    onSave(
      {
        name: name.trim(),
        fieldKey: fieldKey.trim(),
        type,
        required,
        enabled: fieldToEdit ? fieldToEdit.enabled : true,
        sortOrder: fieldToEdit ? fieldToEdit.sortOrder : 99,
        options,
        system: fieldToEdit ? fieldToEdit.system : false
      },
      fieldToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              <Sliders className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-serif italic">
                {fieldToEdit ? 'Edit Log Field Schema' : 'Add Custom Log Field'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">SQLite Table: log_fields</p>
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
              Field Label / Display Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Temperature (°C) or pH Reading"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Database Key (JSON attribute identifier) *
            </label>
            <input
              type="text"
              value={fieldKey}
              onChange={e => setFieldKey(e.target.value)}
              disabled={!!fieldToEdit?.system}
              placeholder="e.g. temperatureC"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Input Data Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as LogFieldType)}
                disabled={!!fieldToEdit?.system}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-500 font-medium"
              >
                <option value="text">Text (Single Line)</option>
                <option value="number">Number (Integer / Decimal)</option>
                <option value="time">24h Time (dd/mm/yy hh.mm)</option>
                <option value="date">Date</option>
                <option value="dropdown">Dropdown List</option>
                <option value="signature">Electronic Signature</option>
              </select>
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-900 transition">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={e => setRequired(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-white focus:ring-0"
                />
                <span className="text-zinc-300 font-medium">Mandatory Field</span>
              </label>
            </div>
          </div>

          {type === 'dropdown' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Dropdown Options (Comma separated)
              </label>
              <input
                type="text"
                value={optionsStr}
                onChange={e => setOptionsStr(e.target.value)}
                placeholder="Passed, Failed, Inconclusive, Recalibrated"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
              />
            </div>
          )}

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
              {fieldToEdit ? 'Save Schema' : 'Add Field'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
