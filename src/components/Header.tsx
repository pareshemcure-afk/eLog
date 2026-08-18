import React from 'react';
import {
  Database,
  Layers,
  FileSpreadsheet,
  Terminal,
  LogOut,
  User,
  Shield,
  Download,
  Activity,
  HardDrive
} from 'lucide-react';
import { AppMode, Session, DatabaseStats } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  session: Session | null;
  dbStats: DatabaseStats | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onDownloadSqlite: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  session,
  dbStats,
  onOpenLogin,
  onLogout,
  onDownloadSqlite
}) => {
  return (
    <header className="h-16 border-b border-[#27272a] bg-[#09090b] flex items-center justify-between px-4 sm:px-8 text-[#d4d4d8] sticky top-0 z-40">
      
      {/* Brand & Mode Switcher */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs shadow-inner">
            <Database className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>eLOG</span>
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 hidden md:inline">
                Dual-Engine
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden sm:block font-serif italic">
              Equipment Usage &amp; Access Relational Concierge
            </p>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-[#27272a] hidden md:block"></div>

        {/* Triple Mode Switcher */}
        <div className="flex items-center bg-[#0c0c0e] p-1 rounded-lg border border-[#27272a]">
          <button
            id="btn_mode_standard"
            onClick={() => onSelectMode('standard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition uppercase tracking-wider font-medium ${
              currentMode === 'standard'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">eLOG Suite</span>
          </button>

          <button
            id="btn_mode_access"
            onClick={() => onSelectMode('access')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition uppercase tracking-wider font-medium ${
              currentMode === 'access'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-300" />
            <span>Access Workspace</span>
          </button>

          <button
            id="btn_mode_sqlite_studio"
            onClick={() => onSelectMode('sqlite_studio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition uppercase tracking-wider font-medium ${
              currentMode === 'sqlite_studio'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQLite Studio</span>
          </button>
        </div>
      </div>

      {/* Right User & Database Live Status Ribbon */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* DB Size / Engine Pill */}
        {dbStats && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-md bg-[#0c0c0e] border border-[#27272a] text-[11px] font-mono">
            <div className="flex items-center gap-1 text-zinc-400">
              <HardDrive className="w-3 h-3 text-zinc-500" />
              <span>{(dbStats.sizeBytes / 1024).toFixed(1)} KB</span>
            </div>
            <div className="h-3 w-[1px] bg-[#27272a]"></div>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>WASM 3.x</span>
            </div>
          </div>
        )}

        {/* Download DB Quick Trigger */}
        <button
          onClick={onDownloadSqlite}
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white border border-[#27272a] hover:border-zinc-700 rounded-md transition"
          title="Download .sqlite binary database"
        >
          <Download className="w-3 h-3" />
          <span className="text-[11px] uppercase tracking-wider">.sqlite</span>
        </button>

        {/* User Session State */}
        {session ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white leading-none flex items-center gap-1 justify-end">
                <span>{session.fullName}</span>
                {session.role === 'Admin' && (
                  <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] px-1 rounded uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">@{session.username}</div>
            </div>

            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-xs shadow-inner">
              {session.fullName.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-md transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-md text-xs font-bold uppercase tracking-wider transition shadow-sm"
          >
            Sign In
          </button>
        )}

      </div>
    </header>
  );
};
