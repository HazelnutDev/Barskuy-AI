import React from "react";
import { X, Globe, Cpu, Zap, Sliders, ShieldCheck, AlertCircle, Key, Layers, Info } from "lucide-react";
import { AppSettings } from "../types";
import { cn } from "../lib/utils";

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
        <div className="p-4 md:p-8 border-b border-[var(--border-main)] flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-purple-600/10 shrink-0">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-600 rounded-xl md:rounded-2xl shadow-lg shadow-blue-600/20">
              <Sliders className="w-5 h-5 md:w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)] tracking-tight">Konfigurasi</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-widest">Pusat Kontrol AI Lanjutan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 md:p-2.5 hover:bg-[var(--border-main)] rounded-xl md:rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all border border-transparent hover:border-[var(--border-main)]">
            <X className="w-5 h-5 md:w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Provider Selection Dropdown */}
          <div className="space-y-3 md:space-y-4">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              Mesin AI Utama
            </label>
            <div className="relative group">
              <select
                value={settings.provider}
                onChange={(e) => onUpdate({ ...settings, provider: e.target.value as any })}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl md:rounded-2xl p-3 md:p-4 text-sm md:text-base text-[var(--text-main)] font-bold focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer hover:bg-[var(--border-main)]"
              >
                <option value="gemini">Google Gemini (Cloud)</option>
                <option value="ollama">Ollama (Mesin Lokal)</option>
                <option value="llama-cpp">Llama.cpp (Mesin Lokal GGUF)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                <Cpu className="w-4 h-4 md:w-5 h-5" />
              </div>
            </div>
          </div>

          {/* API Keys Section */}
          <div className="space-y-3 md:space-y-4">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-yellow-400" />
              Autentikasi & Kunci
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Gemini API Key (Otomatis)"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl md:rounded-2xl p-3 md:p-4 text-[var(--text-muted)] text-xs md:text-sm font-mono outline-none cursor-not-allowed"
                  disabled
                  value="••••••••••••••••••••••••••••"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <ShieldCheck className="w-4 h-4 text-green-500/50" />
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 md:p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <Info className="w-3.5 h-3.5 md:w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-[9px] md:text-[10px] text-blue-400/80 leading-relaxed">
                  Gemini API Key dikelola melalui panel Secrets AI Studio untuk keamanan maksimal.
                </p>
              </div>
            </div>
          </div>

          {/* Ollama Config */}
          {settings.provider === "ollama" && (
            <div className="space-y-4 md:space-y-6 animate-in slide-in-from-top-4 duration-500">
              <div className="p-4 md:p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl md:rounded-[2rem] space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-3 text-yellow-400 font-black text-[10px] uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4 md:w-5 h-5" />
                  <span>Pengaturan Lokal Ollama</span>
                </div>
                <p className="text-[10px] md:text-xs text-[var(--text-main)]/60 leading-relaxed">
                  Untuk mengizinkan akses browser, jalankan Ollama dengan CORS aktif:
                </p>
                <code className="block bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl font-mono text-[10px] md:text-xs text-blue-300 border border-white/5 select-all break-all">
                  OLLAMA_ORIGINS="*" ollama serve
                </code>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Endpoint Ollama
                  </label>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${settings.ollamaUrl}/api/tags`);
                        if (res.ok) alert("✅ Koneksi Berhasil!");
                        else alert("❌ Koneksi Gagal: " + res.statusText);
                      } catch (e) {
                        alert("❌ Koneksi Gagal: Periksa pengaturan CORS.");
                      }
                    }}
                    className="text-[9px] md:text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                  >
                    Tes Koneksi
                  </button>
                </div>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => onUpdate({ ...settings, ollamaUrl: e.target.value })}
                  placeholder="http://127.0.0.1:11434"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm text-[var(--text-main)] font-medium focus:border-blue-500/50 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Llama.cpp Config */}
          {settings.provider === "llama-cpp" && (
            <div className="space-y-4 md:space-y-6 animate-in slide-in-from-top-4 duration-500">
              <div className="p-4 md:p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl md:rounded-[2rem] space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-3 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                  <AlertCircle className="w-4 h-4 md:w-5 h-5" />
                  <span>Pengaturan Llama.cpp</span>
                </div>
                <p className="text-[10px] md:text-xs text-[var(--text-main)]/60 leading-relaxed">
                  Jalankan <code className="text-blue-400">llama-server</code> dengan GPU penuh (GPU0 & GPU1) dan CPU:
                </p>
                <code className="block bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl font-mono text-[10px] md:text-xs text-blue-300 border border-white/5 select-all break-all">
                  ./llama-server -m models/model.gguf -ngl 99 --host 0.0.0.0 --port 8080
                </code>
              </div>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Endpoint Llama.cpp
                  </label>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${settings.llamaCppUrl}/v1/models`);
                        if (res.ok) alert("✅ Koneksi Berhasil!");
                        else alert("❌ Koneksi Gagal: " + res.statusText);
                      } catch (e) {
                        alert("❌ Koneksi Gagal: Periksa apakah server aktif.");
                      }
                    }}
                    className="text-[9px] md:text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
                  >
                    Tes Koneksi
                  </button>
                </div>
                <input
                  type="text"
                  value={settings.llamaCppUrl}
                  onChange={(e) => onUpdate({ ...settings, llamaCppUrl: e.target.value })}
                  placeholder="http://127.0.0.1:8080"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm text-[var(--text-main)] font-medium focus:border-blue-500/50 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Theme Selection */}
          <div className="space-y-3 md:space-y-4">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              Mode Tampilan
            </label>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {(["auto", "dark", "light"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdate({ ...settings, themeMode: mode })}
                  className={cn(
                    "py-3 px-4 rounded-xl md:rounded-2xl border text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
                    settings.themeMode === mode
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                      : "bg-[var(--bg-main)] border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--border-main)] hover:text-[var(--text-main)]"
                  )}
                >
                  {mode === "auto" ? "Otomatis" : mode === "dark" ? "Gelap" : "Terang"}
                </button>
              ))}
            </div>
          </div>

          {/* System Instruction */}
          <div className="space-y-3 md:space-y-4">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Instruksi Sistem Lanjutan
            </label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => onUpdate({ ...settings, systemPrompt: e.target.value })}
              rows={4}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl md:rounded-[2rem] p-4 md:p-6 text-xs md:text-sm text-[var(--text-main)] leading-relaxed focus:border-blue-500/50 outline-none transition-all resize-none custom-scrollbar"
              placeholder="Tentukan bagaimana AI harus berperilaku..."
            />
          </div>
        </div>

        <div className="p-4 md:p-8 bg-[var(--bg-main)]/20 border-t border-[var(--border-main)] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 md:py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-xl md:rounded-[2rem] shadow-2xl shadow-blue-600/20 transition-all active:scale-[0.98] text-xs md:text-sm"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
};
