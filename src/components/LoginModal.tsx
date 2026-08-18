import React, { useState } from 'react';
import { X, Lock, User, ShieldCheck, Key } from 'lucide-react';
import { UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, passwordHash: string) => boolean;
  onRegister: (username: string, passwordHash: string, fullName: string, role: UserRole) => boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Operator');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    if (isRegisterMode) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name for signature verification.');
        return;
      }
      const success = onRegister(username.trim(), password.trim(), fullName.trim(), role);
      if (success) {
        onClose();
      } else {
        setErrorMsg('Username already exists. Please choose a different username.');
      }
    } else {
      const success = onLogin(username.trim(), password.trim());
      if (success) {
        onClose();
      } else {
        setErrorMsg('Invalid username or password. (Demo: admin/admin123 or operator/op123)');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              <Lock className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-serif italic">
                {isRegisterMode ? 'Register Operator Account' : '21 CFR Part 11 Sign In'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">SQLite Authentication Authority</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {isRegisterMode && (
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Full Legal Name (For Signature Record)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Dr. Alex Morgan"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Username ID
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. admin or operator"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Password / Electronic Credential
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          {isRegisterMode && (
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Role &amp; Privilege Authority
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-500 font-medium"
              >
                <option value="Operator">Operator (Usage Logging &amp; Signatures)</option>
                <option value="Admin">Admin (Schema Customizer &amp; Database Tools)</option>
              </select>
            </div>
          )}

          {/* Preset Demo Logins */}
          {!isRegisterMode && (
            <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] text-zinc-400 space-y-1">
              <div className="font-bold text-zinc-300 text-[10px] uppercase font-mono tracking-wider">Demo Credentials:</div>
              <div className="flex items-center justify-between font-mono">
                <span>Admin: <strong className="text-white">admin</strong> / <strong className="text-white">admin123</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('admin123');
                  }}
                  className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold underline"
                >
                  Fill
                </button>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span>Operator: <strong className="text-white">operator</strong> / <strong className="text-white">op123</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('operator');
                    setPassword('op123');
                  }}
                  className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold underline"
                >
                  Fill
                </button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#27272a] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
              }}
              className="text-xs text-zinc-400 hover:text-white font-medium transition"
            >
              {isRegisterMode ? 'Already registered? Sign In' : 'Create new user account'}
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-[10px] font-bold uppercase tracking-widest rounded-lg transition shadow-sm"
            >
              {isRegisterMode ? 'Register Account' : 'Authenticate'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
