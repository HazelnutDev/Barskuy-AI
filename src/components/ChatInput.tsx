import React, { useRef, useState } from "react";
import { Send, Paperclip, Image as ImageIcon, X, Sparkles, Loader2, Cpu, Headphones } from "lucide-react";
import { Attachment } from "../types";
import { cn } from "../lib/utils";
import { processFile } from "../services/fileService";

interface ChatInputProps {
  onSend: (content: string, attachments: Attachment[]) => void;
  onToggleVoice: () => void;
  isLoading: boolean;
  provider: "gemini" | "ollama" | "llama-cpp" | "openrouter";
  isImageMode: boolean;
  onToggleImageMode: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  onToggleVoice, 
  isLoading, 
  provider,
  isImageMode,
  onToggleImageMode
}) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="p-4 max-w-5xl mx-auto w-full">
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-2xl focus-within:border-blue-500/50 transition-all overflow-hidden">
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

        <div className="flex items-end gap-2 p-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isProcessing}
            className="p-2.5 hover:bg-[var(--border-main)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>

          <button
            onClick={onToggleVoice}
            disabled={isLoading || isProcessing}
            className="p-2.5 hover:bg-blue-600/20 rounded-xl text-blue-400 hover:text-blue-300 transition-all disabled:opacity-50 group relative"
          >
            <Headphones className="w-5 h-5" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-blue-600 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-white">
              Dual Konv. (Suara)
            </span>
          </button>

          <button
            onClick={onToggleImageMode}
            disabled={isLoading || isProcessing}
            className={cn(
              "p-2.5 rounded-xl transition-all disabled:opacity-50 group relative",
              isImageMode 
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" 
                : "hover:bg-purple-600/10 text-purple-400/60 hover:text-purple-400"
            )}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-purple-600 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none text-white">
              Mode Gambar (DALL-E/Imagen)
            </span>
          </button>
          
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
                  : `Pesan ${provider === "gemini" ? "Gemini" : provider === "ollama" ? "Ollama" : provider === "llama-cpp" ? "Llama.cpp" : "OpenRouter"}...`
            }
            className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--text-main)] placeholder-[var(--text-muted)] py-2.5 resize-none max-h-[200px] custom-scrollbar"
          />

          <button
            onClick={handleSend}
            disabled={(!content.trim() && attachments.length === 0) || isLoading || isProcessing}
            className={cn(
              "p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100",
              content.trim() || attachments.length > 0
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-[var(--border-main)] text-[var(--text-muted)]"
            )}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
