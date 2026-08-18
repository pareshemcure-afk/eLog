/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Loader2,
  AlertCircle,
  Download,
  Plus,
  RotateCcw,
  Sparkles
} from 'lucide-react';

import {
  AppMode,
  AppView,
  Equipment,
  LogEntry,
  LogField,
  User,
  AuditRecord,
  Session,
  ToastMessage,
  DatabaseStats,
  UserRole
} from './types';

import { sqliteEngine } from './db/sqliteEngine';
import { fmtDT, fmtDate, generateUid } from './utils/dateTime';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EquipmentView } from './components/EquipmentView';
import { LogBookView } from './components/LogBookView';
import { LogFieldsView } from './components/LogFieldsView';
import { AuditTrailView } from './components/AuditTrailView';
import { UsersView } from './components/UsersView';
import { AccessModeView } from './components/AccessModeView';
import { SqlStudioView } from './components/SqlStudioView';
import { ToastContainer } from './components/Toast';

// Modals
import { LoginModal } from './components/LoginModal';
import { EquipmentModal } from './components/EquipmentModal';
import { LogEntryModal } from './components/LogEntryModal';
import { FieldModal } from './components/FieldModal';
import { UserModal } from './components/UserModal';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  // Database readiness
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // App navigation & mode
  const [mode, setMode] = useState<AppMode>('standard');
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  // Active Session
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const saved = localStorage.getItem('eLOG_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Reactive Data Stores
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fields, setFields] = useState<LogField[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditRecord[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<LogEntry | null>(null);
  const [defaultLogEquipmentId, setDefaultLogEquipmentId] = useState<string | null>(null);

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<LogField | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: generateUid(),
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Sync data from SQLite
  const reloadDataFromDb = useCallback(() => {
    if (!sqliteEngine.isReady()) return;
    try {
      setEquipment(sqliteEngine.getEquipment());
      setLogs(sqliteEngine.getLogEntries());
      setFields(sqliteEngine.getFields());
      setUsers(sqliteEngine.getUsers());
      setAuditTrail(sqliteEngine.getAuditTrail());
      setDbStats(sqliteEngine.getDatabaseStats());
    } catch (err: any) {
      console.error('Error reloading data from SQLite:', err);
    }
  }, []);

  // Initialize SQLite Engine on Mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await sqliteEngine.init();
        if (isMounted) {
          setIsDbReady(true);
          reloadDataFromDb();
          addToast('SQLite Database initialized & persistent IndexedDB synced.', 'success');
        }
      } catch (err: any) {
        console.error('Failed to initialize SQLite WASM:', err);
        if (isMounted) {
          setDbError(err.message || 'Failed to initialize SQLite WebAssembly engine.');
        }
      }
    })();

    const unsubscribe = sqliteEngine.subscribe(() => {
      if (isMounted) reloadDataFromDb();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [reloadDataFromDb, addToast]);

  // Session authentication handlers
  const handleLogin = (username: string, passwordHash: string): boolean => {
    const user = sqliteEngine.login(username, passwordHash);
    if (user) {
      const newSession: Session = {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        loginAt: Date.now()
      };
      setSession(newSession);
      try {
        localStorage.setItem('eLOG_session', JSON.stringify(newSession));
      } catch {}
      addToast(`Welcome back, ${user.fullName}! Authenticated as ${user.role}.`, 'success');
      return true;
    }
    return false;
  };

  const handleRegister = (username: string, passwordHash: string, fullName: string, role: UserRole): boolean => {
    try {
      const newUser = sqliteEngine.registerUser(username, passwordHash, fullName, role);
      const newSession: Session = {
        userId: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        loginAt: Date.now()
      };
      setSession(newSession);
      try {
        localStorage.setItem('eLOG_session', JSON.stringify(newSession));
      } catch {}
      addToast(`Account created for ${newUser.fullName}.`, 'success');
      return true;
    } catch (e: any) {
      return false;
    }
  };

  const handleLogout = () => {
    if (session) {
      sqliteEngine.addAudit({
        user: session.fullName,
        action: 'Logout',
        entityType: 'Session',
        entityName: session.username,
        details: 'User signed out'
      });
    }
    setSession(null);
    try {
      localStorage.removeItem('eLOG_session');
    } catch {}
    addToast('Signed out successfully.', 'info');
  };

  // Binary SQLite Download
  const handleDownloadSqliteBinary = () => {
    try {
      const binary = sqliteEngine.exportDatabaseBinary();
      const blob = new Blob([binary], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eLOG_Database_${fmtDate(new Date()).replace(/\//g, '-')}.sqlite`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('SQLite database binary (.sqlite) downloaded.', 'success');
    } catch (e: any) {
      addToast(`Export failed: ${e.message}`, 'error');
    }
  };

  // CSV Export for Logs
  const handleExportLogsCsv = () => {
    try {
      const headers = ['EntryNo', 'Equipment', 'BatchNo', 'StartTime', 'StartSign', 'EndTime', 'EndSign', 'Remark', 'CreatedBy', 'CreatedAt'];
      const rows = logs.map(l => {
        const eq = equipment.find(e => e.id === l.equipmentId);
        return [
          `"${l.entryNo}"`,
          `"${eq?.name || l.equipmentId}"`,
          `"${l.values.batchNo || ''}"`,
          `"${l.values.startTime || ''}"`,
          `"${l.values.startUser || ''}"`,
          `"${l.values.endTime || ''}"`,
          `"${l.values.endUser || ''}"`,
          `"${(l.values.remark || '').replace(/"/g, '""')}"`,
          `"${l.createdBy}"`,
          `"${l.createdAt}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eLOG_Usage_Entries_${fmtDate(new Date()).replace(/\//g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Logbook entries exported as CSV.', 'success');
    } catch (e: any) {
      addToast(`CSV export failed: ${e.message}`, 'error');
    }
  };

  // CSV Export for Audit Trail
  const handleExportAuditCsv = () => {
    try {
      const headers = ['Timestamp', 'User', 'Action', 'EntityType', 'EntityName', 'Details'];
      const rows = auditTrail.map(a => [
        `"${a.dtDisplay}"`,
        `"${a.user}"`,
        `"${a.action}"`,
        `"${a.entityType}"`,
        `"${a.entityName}"`,
        `"${a.details.replace(/"/g, '""')}"`
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eLOG_Audit_Trail_${fmtDate(new Date()).replace(/\//g, '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Audit trail exported as CSV.', 'success');
    } catch (e: any) {
      addToast(`Audit export failed: ${e.message}`, 'error');
    }
  };

  // CRUD Actions: Equipment
  const handleSaveEquipment = (data: any, existingId?: string) => {
    try {
      const saved = sqliteEngine.saveEquipment(data, existingId);
      setIsEquipmentModalOpen(false);
      setEquipmentToEdit(null);
      addToast(`Equipment "${saved.name}" saved.`, 'success');
    } catch (e: any) {
      addToast(`Error saving equipment: ${e.message}`, 'error');
    }
  };

  const handleDeleteEquipment = (id: string, name: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Equipment Unit',
      message: `Are you sure you want to delete "${name}"? All associated log entries will also be permanently deleted from the database.`,
      confirmLabel: 'Delete Equipment',
      isDestructive: true,
      onConfirm: () => {
        try {
          sqliteEngine.deleteEquipment(id);
          addToast(`Equipment "${name}" deleted from database.`, 'info');
          setConfirmModalState(prev => ({ ...prev, isOpen: false }));
        } catch (e: any) {
          addToast(`Error deleting equipment: ${e.message}`, 'error');
        }
      }
    });
  };

  // CRUD Actions: Log Entry
  const handleSaveLogEntry = (data: any, existingId?: string) => {
    try {
      const saved = sqliteEngine.saveLogEntry(data, existingId);
      setIsLogModalOpen(false);
      setEntryToEdit(null);
      setDefaultLogEquipmentId(null);
      addToast(`Log entry #${saved.entryNo} recorded & electronically signed.`, 'success');
    } catch (e: any) {
      addToast(`Error saving log entry: ${e.message}`, 'error');
    }
  };

  const handleDeleteLogEntry = (id: string, entryNo: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Log Entry',
      message: `Are you sure you want to delete Log Entry #${entryNo}? This operation will be recorded in the Audit Trail.`,
      confirmLabel: 'Delete Entry',
      isDestructive: true,
      onConfirm: () => {
        try {
          sqliteEngine.deleteLogEntry(id);
          addToast(`Log Entry #${entryNo} deleted.`, 'info');
          setConfirmModalState(prev => ({ ...prev, isOpen: false }));
        } catch (e: any) {
          addToast(`Error deleting entry: ${e.message}`, 'error');
        }
      }
    });
  };

  // CRUD Actions: Field
  const handleSaveField = (data: any, existingId?: string) => {
    try {
      const saved = sqliteEngine.saveField(data, existingId);
      setIsFieldModalOpen(false);
      setFieldToEdit(null);
      addToast(`Log field "${saved.name}" updated.`, 'success');
    } catch (e: any) {
      addToast(`Error saving field: ${e.message}`, 'error');
    }
  };

  const handleDeleteField = (id: string, name: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Custom Field',
      message: `Are you sure you want to delete the field "${name}"?`,
      confirmLabel: 'Delete Field',
      isDestructive: true,
      onConfirm: () => {
        try {
          sqliteEngine.deleteField(id);
          addToast(`Field "${name}" removed.`, 'info');
          setConfirmModalState(prev => ({ ...prev, isOpen: false }));
        } catch (e: any) {
          addToast(`Error deleting field: ${e.message}`, 'error');
        }
      }
    });
  };

  const handleToggleField = (id: string, enabled: boolean) => {
    try {
      sqliteEngine.toggleField(id, enabled);
      addToast(`Field ${enabled ? 'enabled' : 'disabled'}.`, 'info');
    } catch (e: any) {
      addToast(`Toggle failed: ${e.message}`, 'error');
    }
  };

  const handleReorderFields = (newOrderedFields: LogField[]) => {
    try {
      sqliteEngine.reorderFields(newOrderedFields);
      addToast('Field display order updated.', 'success');
    } catch (e: any) {
      addToast(`Reorder failed: ${e.message}`, 'error');
    }
  };

  // CRUD Actions: User
  const handleSaveUser = (data: any, existingId?: string) => {
    try {
      const saved = sqliteEngine.saveUser(data, existingId);
      setIsUserModalOpen(false);
      setUserToEdit(null);
      addToast(`User account "${saved.fullName}" saved.`, 'success');
    } catch (e: any) {
      addToast(`Error saving user: ${e.message}`, 'error');
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to delete user "${name}"?`,
      confirmLabel: 'Delete User',
      isDestructive: true,
      onConfirm: () => {
        try {
          sqliteEngine.deleteUser(id);
          addToast(`User "${name}" deleted.`, 'info');
          setConfirmModalState(prev => ({ ...prev, isOpen: false }));
        } catch (e: any) {
          addToast(`Error deleting user: ${e.message}`, 'error');
        }
      }
    });
  };

  // Loading Screen while SQLite WASM initializes
  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#d4d4d8] flex flex-col items-center justify-center p-6 font-sans">
        {dbError ? (
          <div className="max-w-md w-full bg-[#0c0c0e] border border-rose-900 p-6 rounded-xl text-center space-y-4 shadow-2xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white font-serif italic">Database Engine Initialization Failed</h2>
            <p className="text-xs text-rose-300 font-mono">{dbError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition uppercase tracking-wider"
            >
              Retry Initialization
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Database className="w-8 h-8 text-zinc-300" />
            </div>
            <div>
              <h1 className="text-2xl font-normal text-white tracking-tight font-serif italic">Database Concierge</h1>
              <p className="text-xs text-zinc-400 mt-1 font-mono">Booting SQLite 3.x WASM &amp; IndexedDB Persistent Bridge...</p>
            </div>
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#d4d4d8] flex flex-col font-sans antialiased selection:bg-zinc-800 selection:text-white">
      
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Application Header & Mode Switcher */}
      <Header
        currentMode={mode}
        onSelectMode={setMode}
        session={session}
        dbStats={dbStats}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onDownloadSqlite={handleDownloadSqliteBinary}
      />

      {/* Mode-Based Routing */}
      {mode === 'access' ? (
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <AccessModeView
            onNotify={addToast}
            onOpenNewLogModal={() => {
              setEntryToEdit(null);
              setDefaultLogEquipmentId(null);
              setIsLogModalOpen(true);
            }}
          />
        </main>
      ) : mode === 'sqlite_studio' ? (
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <SqlStudioView
            onNotify={addToast}
            onDownloadSqlite={handleDownloadSqliteBinary}
          />
        </main>
      ) : (
        /* Standard eLOG Application Layout (Sidebar + Views) */
        <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-6 p-4 sm:p-6">
          
          {/* Left Navigation Sidebar */}
          <aside className="w-full md:w-60 shrink-0">
            <Sidebar
              activeView={activeView}
              onSelectView={setActiveView}
              equipmentCount={equipment.length}
              logsCount={logs.length}
              auditCount={auditTrail.length}
              userRole={session?.role || 'Guest'}
            />
          </aside>

          {/* Center Main View Area */}
          <main className="flex-1 min-w-0">
            
            {activeView === 'dashboard' && (
              <DashboardView
                equipment={equipment}
                logs={logs}
                fields={fields}
                audit={auditTrail}
                session={session}
                dbStats={dbStats}
                onSelectView={setActiveView}
                onOpenNewLogModal={() => {
                  setEntryToEdit(null);
                  setDefaultLogEquipmentId(null);
                  setIsLogModalOpen(true);
                }}
                onOpenNewEquipmentModal={() => {
                  setEquipmentToEdit(null);
                  setIsEquipmentModalOpen(true);
                }}
                onDownloadSqlite={handleDownloadSqliteBinary}
              />
            )}

            {activeView === 'equipment' && (
              <EquipmentView
                equipment={equipment}
                logs={logs}
                session={session}
                onOpenAddModal={() => {
                  setEquipmentToEdit(null);
                  setIsEquipmentModalOpen(true);
                }}
                onOpenEditModal={eq => {
                  setEquipmentToEdit(eq);
                  setIsEquipmentModalOpen(true);
                }}
                onDeleteEquipment={handleDeleteEquipment}
                onOpenLogModalForEquipment={eqId => {
                  setEntryToEdit(null);
                  setDefaultLogEquipmentId(eqId);
                  setIsLogModalOpen(true);
                }}
              />
            )}

            {activeView === 'logs' && (
              <LogBookView
                logs={logs}
                equipmentList={equipment}
                fields={fields}
                session={session}
                onOpenNewLogModal={() => {
                  setEntryToEdit(null);
                  setDefaultLogEquipmentId(null);
                  setIsLogModalOpen(true);
                }}
                onOpenEditLogModal={entry => {
                  setEntryToEdit(entry);
                  setIsLogModalOpen(true);
                }}
                onDeleteLog={handleDeleteLogEntry}
                onExportCsv={handleExportLogsCsv}
              />
            )}

            {activeView === 'fields' && (
              <LogFieldsView
                fields={fields}
                session={session}
                onOpenAddFieldModal={() => {
                  setFieldToEdit(null);
                  setIsFieldModalOpen(true);
                }}
                onOpenEditFieldModal={field => {
                  setFieldToEdit(field);
                  setIsFieldModalOpen(true);
                }}
                onDeleteField={handleDeleteField}
                onToggleField={handleToggleField}
                onReorderFields={handleReorderFields}
              />
            )}

            {activeView === 'audit' && (
              <AuditTrailView
                audit={auditTrail}
                onExportCsv={handleExportAuditCsv}
              />
            )}

            {activeView === 'users' && (
              <UsersView
                users={users}
                session={session}
                onOpenAddUserModal={() => {
                  setUserToEdit(null);
                  setIsUserModalOpen(true);
                }}
                onOpenEditUserModal={u => {
                  setUserToEdit(u);
                  setIsUserModalOpen(true);
                }}
                onDeleteUser={handleDeleteUser}
              />
            )}

          </main>

        </div>
      )}

      {/* Footer Status Bar matching Sophisticated Dark design */}
      <footer className="h-10 border-t border-[#27272a] bg-[#0c0c0e] px-4 sm:px-8 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono font-bold shrink-0 mt-auto">
        <div className="flex gap-4 sm:gap-8">
          <span>Engine: SQLite 3.x WASM</span>
          <span className="hidden sm:inline">Persistence: IndexedDB</span>
          <span>Records: {equipment.length + logs.length + auditTrail.length}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Connected Securely</span>
        </div>
      </footer>

      {/* Global Interactive Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        equipmentToEdit={equipmentToEdit}
        onClose={() => {
          setIsEquipmentModalOpen(false);
          setEquipmentToEdit(null);
        }}
        onSave={handleSaveEquipment}
      />

      <LogEntryModal
        isOpen={isLogModalOpen}
        entryToEdit={entryToEdit}
        equipmentList={equipment}
        presetEquipmentId={defaultLogEquipmentId}
        fields={fields}
        session={session}
        onClose={() => {
          setIsLogModalOpen(false);
          setEntryToEdit(null);
          setDefaultLogEquipmentId(null);
        }}
        onSave={handleSaveLogEntry}
      />

      <FieldModal
        isOpen={isFieldModalOpen}
        fieldToEdit={fieldToEdit}
        onClose={() => {
          setIsFieldModalOpen(false);
          setFieldToEdit(null);
        }}
        onSave={handleSaveField}
      />

      <UserModal
        isOpen={isUserModalOpen}
        userToEdit={userToEdit}
        onClose={() => {
          setIsUserModalOpen(false);
          setUserToEdit(null);
        }}
        onSave={handleSaveUser}
      />

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmLabel={confirmModalState.confirmLabel}
        isDestructive={confirmModalState.isDestructive}
        onCancel={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
      />

    </div>
  );
}
