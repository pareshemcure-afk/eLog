import React, { useState, useEffect } from 'react';
import { X, Users, Lock, Key } from 'lucide-react';
import { User, UserRole } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: { username: string; passwordHash: string; fullName: string; role: UserRole }, existingId?: string) => void;
  userToEdit?: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Operator');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setPassword('');
      setFullName(userToEdit.fullName);
      setRole(userToEdit.role);
    } else {
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('Operator');
    }
    setErrorMsg('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      setErrorMsg('Username and Full Legal Name are required.');
      return;
    }
    if (!userToEdit && !password.trim()) {
      setErrorMsg('Password is required for new accounts.');
      return;
    }

    onSave(
      {
        username: username.trim(),
        passwordHash: password.trim(),
        fullName: fullName.trim(),
        role
      },
      userToEdit?.id
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
              <Users className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-serif italic">
                {userToEdit ? 'Edit User Credentials' : 'Create User Account'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">SQLite Table: users &bull; 21 CFR Authority</p>
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
              Full Legal Name (For Signatures) *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Dr. Eleanor Vance"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={!!userToEdit}
              placeholder="e.g. evance"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Password {userToEdit ? '(Leave blank to keep unchanged)' : '*'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Role Authority &amp; Access Level
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-500 font-medium"
            >
              <option value="Operator">Operator (Standard usage entry &amp; signatures)</option>
              <option value="Admin">Admin (Full schema customizer &amp; SQL studio)</option>
            </select>
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
              {userToEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
