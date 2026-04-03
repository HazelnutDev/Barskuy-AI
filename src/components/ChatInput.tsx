import React, { useRef, useState } from "react";
import { Send, Paperclip, Image as ImageIcon, X, Sparkles, Loader2, Cpu, Headphones, Globe, Check } from "lucide-react";
import { Attachment } from "../types";
import { cn } from "../lib/utils";
import { processFile } from "../services/fileService";
import { motion, AnimatePresence } from "motion/react";

interface ChatInputProps {
  onSend: (content: string, attachments: Attachment[]) => void;
  onToggleVoice: () => void;
  isLoading: boolean;
  provider: "gemini" | "ollama" | "llama-cpp" | "openrouter" | "openai" | "anthropic" | "deepseek";
  isImageMode: boolean;
  onToggleImageMode: () => void;
  searchProvider: "off" | "ollama" | "serpapi";
  onSetSearchProvider: (provider: "off" | "ollama" | "serpapi") => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  onToggleVoice, 
  isLoading, 
  provider,
  isImageMode,
  onToggleImageMode,
  searchProvider,
  onSetSearchProvider
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchMenuRef = useRef<HTMLDivElement>(null);

  // Close search menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchMenuRef.current && !searchMenuRef.current.contains(event.target as Node)) {
        setShowSearchMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || isLoading) return;
    onSend(content, attachments);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    for (const file of Array.from(files)) {
      try {
        const { content: fileContent, type } = await processFile(file);
        let url: string | undefined;
        
        if (type === "image") {
          const reader = new FileReader();
          url = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: type as any,
          size: file.size,
          content: fileContent,
          url,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      } catch (error) {
        console.error("Error processing file", error);
      }
    }
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-2 md:p-4 max-w-5xl mx-auto w-full">
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl focus-within:border-blue-500/30 transition-all ring-0 outline-none">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 border-b border-[var(--border-main)] bg-[var(--bg-main)]/50">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 p-1 bg-[var(--border-main)] border border-[var(--border-main)] rounded-xl text-xs text-[var(--text-main)]/80 pr-3"
              >
                {att.type === "image" && att.url ? (
                  <img src={att.url} alt={att.name} className="w-8 h-8 rounded-lg object-cover border border-[var(--border-main)]" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)]/20 flex items-center justify-center">
                    {att.type === "image" ? (
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                )}
                <span className="truncate max-w-[100px] font-medium">{att.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1 md:gap-2 p-2 md:p-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessing}
            className="p-2 md:p-2.5 hover:bg-[var(--border-main)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin" /> : <Paperclip className="w-4 h-4 md:w-5 h-5" />}
          </button>

          <button
            onClick={onToggleVoice}
            disabled={isLoading || isProcessing}
            className="p-2 md:p-2.5 hover:bg-blue-600/20 rounded-xl text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50 group relative"
          >
            <Headphones className="w-4 h-4 md:w-5 h-5" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-600 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-white hidden md:block">
              Dual Konv. (Suara)
            </span>
          </button>

          <button
            onClick={onToggleImageMode}
            disabled={isLoading || isProcessing}
            className={cn(
              "p-2 md:p-2.5 rounded-xl transition-all disabled:opacity-50 group relative",
              isImageMode 
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" 
                : "hover:bg-purple-600/10 text-purple-400/60 hover:text-purple-400"
            )}
          >
            <ImageIcon className="w-4 h-4 md:w-5 h-5" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-purple-600 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-white hidden md:block">
              Mode Gambar (DALL-E/Imagen)
            </span>
          </button>

          <div className="relative" ref={searchMenuRef}>
            <button
              onClick={() => setShowSearchMenu(!showSearchMenu)}
              disabled={isLoading || isProcessing}
              className={cn(
                "p-2 md:p-2.5 rounded-xl transition-all disabled:opacity-50 group relative",
                searchProvider !== "off"
                  ? "bg-green-600/20 text-green-400 border border-green-500/30"
                  : "hover:bg-green-600/10 text-green-400/60 hover:text-green-400"
              )}
            >
              <Globe className="w-4 h-4 md:w-5 h-5" />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-600 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-white hidden md:block">
                Web Search ({searchProvider})
              </span>
            </button>

            <AnimatePresence>
              {showSearchMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                  <div className="space-y-1">
                    {[
                      { id: "off", label: "Off (Default)", color: "text-[var(--text-muted)]" },
                      { id: "ollama", label: "Ollama Search", color: "text-blue-400" },
                      { id: "serpapi", label: "SerpApi Search", color: "text-green-400" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          onSetSearchProvider(opt.id as any);
                          setShowSearchMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          searchProvider === opt.id
                            ? "bg-white/5 text-white"
                            : "hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        )}
                      >
                        <span className={opt.color}>{opt.label}</span>
                        {searchProvider === opt.id && <Check className="w-3 h-3 text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading 
                ? "Barskuy-AI sedang berpikir..." 
                : isImageMode 
                  ? "Deskripsikan gambar yang ingin dibuat..." 
                  : `Pesan ${
                      provider === "gemini" ? "Gemini" : 
                      provider === "ollama" ? "Ollama" : 
                      provider === "llama-cpp" ? "Llama.cpp" : 
                      provider === "openrouter" ? "OpenRouter" :
                      provider === "openai" ? "OpenAI" :
                      provider === "anthropic" ? "Anthropic" :
                      "DeepSeek"
                    }...`
            }
            className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--text-main)] placeholder-[var(--text-muted)] py-2.5 resize-none max-h-[200px] custom-scrollbar outline-none ring-0"
          />

          <button
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || isLoading || isProcessing}
            className={cn(
              "p-2 md:p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100",
              content.trim() || attachments.length > 0
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-[var(--border-main)] text-[var(--text-muted)]"
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 md:w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 h-5" />}
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept="image/*,.pdf,.docx,.doc,.txt"
        />
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          <span>RAG Aktif</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-[var(--border-main)]" />
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3" />
          <span>Mesin {provider}</span>
        </div>
      </div>
    </div>
  );
};
