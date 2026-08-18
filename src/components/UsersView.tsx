import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  User,
  Key,
  Edit2,
  Trash2,
  Calendar,
  Lock
} from 'lucide-react';
import { User as UserType, Session } from '../types';
import { fmtDate } from '../utils/dateTime';

interface UsersViewProps {
  users: UserType[];
  session: Session | null;
  onOpenAddUserModal: () => void;
  onOpenEditUserModal: (user: UserType) => void;
  onDeleteUser: (id: string, name: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  session,
  onOpenAddUserModal,
  onOpenEditUserModal,
  onDeleteUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(
    u =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="view_user_accounts" className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272a] pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mb-1">
            Access Control &bull; SQLite Table users
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif italic">
            User Account Management
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage authenticated operators, electronic signature authorities, and administrator credentials.
          </p>
        </div>

        <button
          id="btn_add_user_account"
          onClick={onOpenAddUserModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded-lg transition hover:bg-zinc-200 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-[#0c0c0e] p-3 rounded-xl border border-[#27272a]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search users by name, username, or role..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 font-sans"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const isCurrentUser = session?.userId === user.id;

          return (
            <div
              key={user.id}
              className="bg-[#0c0c0e] rounded-xl border border-[#27272a] hover:border-zinc-700 p-5 flex flex-col justify-between transition group"
            >
              <div className="space-y-3">
                
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold border ${
                      user.role === 'Admin'
                        ? 'bg-purple-950/60 text-purple-400 border-purple-800/60'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    {user.role}
                  </span>

                  {isCurrentUser && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                      Current Session
                    </span>
                  )}
                </div>

                {/* Name & Avatar */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{user.fullName}</h3>
                    <div className="text-[11px] text-zinc-500 font-mono">@{user.username}</div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 font-mono pt-1">
                  Created: {fmtDate(user.createdAt)}
                </div>

              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#27272a] mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => onOpenEditUserModal(user)}
                  className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>

                {!isCurrentUser && (
                  <button
                    onClick={() => onDeleteUser(user.id, user.fullName)}
                    className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
