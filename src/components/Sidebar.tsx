import React, { useState } from "react";
import { Plus, MessageSquare, Trash2, Cpu, LogOut, User as UserIcon, MoreVertical, ChevronLeft, Search } from "lucide-react";
import { ChatSession, AppSettings } from "../types";
import { cn } from "../lib/utils";

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenSettings,
  settings,
  isOpen,
  setIsOpen,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] flex flex-col text-[var(--text-main)] transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-[var(--border-main)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Barskuy-AI</h1>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Asisten Canggih</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-[var(--border-main)] rounded-lg text-[var(--text-muted)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-[var(--border-main)] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-lg shadow-blue-600/10 text-white"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span className="font-bold">Chat Baru</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Cari riwayat chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500/50 transition-all text-[var(--text-main)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-muted)] text-xs italic">
              {searchQuery ? "Tidak ada hasil ditemukan" : "Belum ada riwayat chat"}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={cn(
                  "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                  currentSessionId === session.id
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "hover:bg-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                )}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{session.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-[var(--border-main)] relative">
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              <div className="p-2 space-y-1">
                <button 
                  onClick={() => {
                    onOpenSettings();
                    setShowProfileMenu(false);
                  }}
                  className="w-full p-2.5 flex items-center gap-3 hover:bg-[var(--border-main)] rounded-xl transition-colors text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Pengaturan Profil</span>
                </button>
                <button className="w-full p-2.5 flex items-center gap-3 hover:bg-[var(--border-main)] rounded-xl transition-colors text-sm text-red-400 hover:bg-red-400/10">
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={cn(
              "w-full p-2 flex items-center gap-3 hover:bg-[var(--border-main)] rounded-2xl transition-all group",
              showProfileMenu && "bg-[var(--border-main)]"
            )}
          >
            <div className="relative">
              <img 
                src={settings.user?.avatar} 
                alt={settings.user?.name}
                className="w-10 h-10 rounded-xl object-cover border border-[var(--border-main)] shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[var(--bg-sidebar)] rounded-full" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold truncate text-[var(--text-main)]">{settings.user?.name}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate font-medium">{settings.user?.email}</p>
            </div>
            <MoreVertical className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
          </button>
        </div>
      </div>
    </>
  );
};
