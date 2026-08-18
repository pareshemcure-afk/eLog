import React from 'react';
import {
  Sliders,
  Plus,
  GripVertical,
  Check,
  X,
  Edit2,
  Trash2,
  Lock,
  Tag,
  Clock,
  Shield,
  Layers
} from 'lucide-react';
import { LogField, Session } from '../types';

interface LogFieldsViewProps {
  fields: LogField[];
  session: Session | null;
  onOpenAddFieldModal: () => void;
  onOpenEditFieldModal: (field: LogField) => void;
  onDeleteField: (id: string, name: string) => void;
  onToggleField: (id: string, enabled: boolean) => void;
  onReorderFields: (orderedFields: LogField[]) => void;
}

export const LogFieldsView: React.FC<LogFieldsViewProps> = ({
  fields,
  session,
  onOpenAddFieldModal,
  onOpenEditFieldModal,
  onDeleteField,
  onToggleField,
  onReorderFields
}) => {
  const sortedFields = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...sortedFields];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    onReorderFields(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === sortedFields.length - 1) return;
    const reordered = [...sortedFields];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    onReorderFields(reordered);
  };

  return (
    <div id="view_fields_customizer" className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mb-1">
            Schema Configuration &bull; SQLite Table log_fields
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif italic">
            Logbook Field Customizer
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Dynamically customize logbook schema, mandatory validation rules, and input types.
          </p>
        </div>

        <button
          id="btn_add_custom_field"
          onClick={onOpenAddFieldModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded-lg transition hover:bg-zinc-200 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Field</span>
        </button>
      </div>

      {/* Fields List */}
      <div className="space-y-3">
        {sortedFields.map((f, idx) => (
          <div
            key={f.id}
            className={`bg-[#0c0c0e] rounded-xl border p-4 flex items-center justify-between gap-4 transition ${
              f.enabled ? 'border-[#27272a] hover:border-zinc-700' : 'border-zinc-900 opacity-60'
            }`}
          >
            {/* Left: Drag / Order Controls & Info */}
            <div className="flex items-center gap-3 min-w-0">
              
              <div className="flex flex-col gap-0.5 text-zinc-600">
                <button
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  className="hover:text-white disabled:opacity-20 text-[10px] px-1 font-mono"
                  title="Move Up"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === sortedFields.length - 1}
                  className="hover:text-white disabled:opacity-20 text-[10px] px-1 font-mono"
                  title="Move Down"
                >
                  ▼
                </button>
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-sm">{f.name}</h4>
                  
                  {/* Type Badge */}
                  <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-[10px] font-mono uppercase tracking-wider">
                    {f.type}
                  </span>

                  {f.required && (
                    <span className="px-2 py-0.5 bg-rose-950/60 text-rose-400 border border-rose-800/60 rounded text-[10px] font-mono uppercase tracking-wider">
                      Required
                    </span>
                  )}

                  {f.system && (
                    <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded text-[10px] font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3 text-zinc-500" />
                      <span>System</span>
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500 font-mono">
                  Key: <code className="text-zinc-400">{f.fieldKey}</code>
                  {f.options && f.options.length > 0 && (
                    <span className="ml-2">
                      &bull; Options: <span className="text-zinc-300 font-sans">{f.options.join(', ')}</span>
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Right: Toggle Switch & Actions */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Enable / Disable Toggle Switch */}
              <button
                onClick={() => onToggleField(f.id, !f.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  f.enabled ? 'bg-emerald-600' : 'bg-zinc-800'
                }`}
                title={f.enabled ? 'Enabled' : 'Disabled'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    f.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onOpenEditFieldModal(f)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition"
                  title="Edit Field Configuration"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {!f.system && (
                  <button
                    onClick={() => onDeleteField(f.id, f.name)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition"
                    title="Delete Custom Field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
