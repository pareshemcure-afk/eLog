import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  BookOpen,
  Sliders,
  ShieldCheck,
  Users,
  Database,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { AppView, UserRole } from '../types';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  equipmentCount: number;
  logsCount: number;
  auditCount: number;
  userRole: UserRole | 'Guest';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  equipmentCount,
  logsCount,
  auditCount,
  userRole
}) => {
  const navItems = [
    {
      id: 'dashboard' as AppView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'equipment' as AppView,
      label: 'Equipment Units',
      icon: Cpu,
      badge: equipmentCount
    },
    {
      id: 'logs' as AppView,
      label: 'Logbook Entries',
      icon: BookOpen,
      badge: logsCount
    },
    {
      id: 'fields' as AppView,
      label: 'Custom Log Fields',
      icon: Sliders,
      badge: null
    },
    {
      id: 'audit' as AppView,
      label: '21 CFR Audit Trail',
      icon: ShieldCheck,
      badge: auditCount
    },
    {
      id: 'users' as AppView,
      label: 'User Accounts',
      icon: Users,
      badge: null,
      adminOnly: true
    }
  ];

  return (
    <div className="bg-[#0c0c0e] rounded-xl border border-[#27272a] p-4 flex flex-col justify-between h-full text-zinc-300">
      
      <div className="space-y-6">
        {/* Navigation Group Header */}
        <div>
          <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
            Data Collections
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav_tab_${item.id}`}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition font-medium ${
                    isActive
                      ? 'bg-zinc-800/90 text-white font-semibold border-l-2 border-zinc-300 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database Engine Architecture Info */}
        <div className="p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-lg text-[11px] space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase tracking-wider font-mono">SQLite 3.x Instance</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono">IndexedDB Sync</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed font-serif italic">
            Full ACID relational consistency with continuous binary IndexedDB snapshots.
          </p>
        </div>
      </div>

      {/* Role Badge Footer */}
      <div className="pt-4 border-t border-[#27272a] mt-4 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[11px] font-mono uppercase tracking-wider">Access: {userRole}</span>
        </div>
      </div>

    </div>
  );
};
