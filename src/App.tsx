import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { MessageItem } from "./components/MessageItem";
import { ChatInput } from "./components/ChatInput";
import { SettingsModal } from "./components/SettingsModal";
import { VoiceMode } from "./components/VoiceMode";
import { useChatHistory } from "./hooks/useChatHistory";
import { Message, Attachment, DEFAULT_SETTINGS, AppSettings } from "./types";
import { geminiService } from "./services/geminiService";
import { ollamaService } from "./services/ollamaService";
import { llamaCppService } from "./services/llamaCppService";
import { Sparkles, Cpu, Zap, Settings, Menu, ChevronDown, Layers, Bot, Headphones, Sun, Moon, Download, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { cn } from "./lib/utils";

export default function App() {
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    updateSessionMessages,
    deleteSession,
  } = useChatHistory();

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("barskuy_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default settings to ensure new properties like 'user' exist
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error("Failed to parse settings", e);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem("barskuy_settings", JSON.stringify(settings));
    fetchModels();
    
    // Auto Theme Logic
    const applyTheme = () => {
      if (settings.themeMode === "auto") {
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 18;
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        // Combine time and system preference
        const shouldBeDark = systemDark || isNight;
        document.documentElement.classList.toggle("dark", shouldBeDark);
      } else {
        document.documentElement.classList.toggle("dark", settings.themeMode === "dark");
      }
    };

    applyTheme();
    // Re-apply on system theme change if in auto mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (settings.themeMode === "auto") applyTheme();
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [settings.provider, settings.ollamaUrl, settings.llamaCppUrl, settings.themeMode]);

  const fetchModels = async () => {
    if (settings.provider === "ollama") {
      const models = await ollamaService.getModels(settings.ollamaUrl);
      setAvailableModels(models.map((m: any) => m.name));
    } else if (settings.provider === "llama-cpp") {
      const models = await llamaCppService.getModels(settings.llamaCppUrl);
      setAvailableModels(models.map((m: any) => m.name));
    } else {
      // Gemini models are usually fixed in SDK, but we can list them
      setAvailableModels([
        "gemini-3-flash-preview",
        "gemini-3.1-pro-preview",
        "gemini-2.5-flash-image"
      ]);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (content: string, attachments: Attachment[]) => {
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createNewSession();
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: isImageMode ? `[GENERATE_IMAGE] ${content}` : content,
      attachments,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    updateSessionMessages(sessionId, updatedMessages);
    setIsLoading(true);

    // Image generation check
    if (isImageMode || content.toLowerCase().startsWith("/imagine") || content.toLowerCase().startsWith("buatkan gambar")) {
      setIsImageMode(false); // Reset mode after use
      try {
        const prompt = content.replace(/^\/imagine\s*|buatkan gambar\s*/i, "");
        const imageUrl = await geminiService.generateImage(prompt);
        if (imageUrl) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Here is the image I generated for: "${prompt}"`,
            attachments: [{ id: crypto.randomUUID(), name: "generated.png", type: "image", url: imageUrl, size: 0 }],
            timestamp: Date.now(),
            model: "Gemini 2.5 Image",
          };
          updateSessionMessages(sessionId, [...updatedMessages, assistantMessage]);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } catch (e) {
        console.error("Image generation failed", e);
      } finally {
        setIsLoading(false);
        return;
      }
    }

    // Combine system prompt with global memory
    const fullSystemPrompt = `${settings.systemPrompt}\n\n[GLOBAL MEMORY FROM PAST CONVERSATIONS]\n${settings.memory || "No memory yet."}`;

    // Single Mode Streaming
    const assistantMessageId = crypto.randomUUID();
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
      model: settings.provider === "gemini" 
        ? settings.geminiModel 
        : settings.provider === "ollama" 
          ? settings.ollamaModel 
          : settings.llamaCppModel,
    };

    updateSessionMessages(sessionId, [...updatedMessages, initialAssistantMessage]);

    let fullContent = "";
    let thinking = "";
    let isThinking = false;

    try {
      const stream = settings.provider === "gemini"
        ? geminiService.streamChat(settings.geminiModel, updatedMessages, fullSystemPrompt, attachments)
        : settings.provider === "ollama"
          ? ollamaService.streamChat(settings.ollamaUrl, settings.ollamaModel, updatedMessages, fullSystemPrompt, attachments)
          : llamaCppService.streamChat(settings.llamaCppUrl, updatedMessages, fullSystemPrompt, attachments);

      for await (const chunk of stream) {
        if (chunk.includes("<think>")) { isThinking = true; continue; }
        if (chunk.includes("</think>")) { isThinking = false; continue; }

        if (isThinking) thinking += chunk;
        else fullContent += chunk;

        updateSessionMessages(sessionId, [
          ...updatedMessages,
          { ...initialAssistantMessage, content: fullContent, thinking, isStreaming: true },
        ]);
      }

      // Generate summary and check for chart data
      let summary = "";
      if (fullContent.length > 200) {
        summary = fullContent.substring(0, 150) + "...";
      }

      const finalAssistantMessage: Message = { 
        ...initialAssistantMessage, 
        content: fullContent, 
        thinking, 
        isStreaming: false,
        summary: summary || undefined
      };
      updateSessionMessages(sessionId, [...updatedMessages, finalAssistantMessage]);

      // Browser Notification
      if (Notification.permission === "granted" && document.hidden) {
        new Notification("Barskuy-AI", {
          body: "AI telah selesai membalas pesan Anda.",
          icon: "/favicon.ico"
        });
      }

      // Update global memory with a summary of the latest exchange
      if (fullContent.length > 10) {
        const newMemoryEntry = `User asked: ${content.substring(0, 50)}... AI replied: ${fullContent.substring(0, 100)}...`;
        setSettings(prev => ({
          ...prev,
          memory: (prev.memory + "\n" + newMemoryEntry).slice(-2000)
        }));
      }
    } catch (error) {
      console.error("Streaming error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, type: "positive" | "negative") => {
    if (!currentSessionId) return;
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback: type } : msg
    );
    updateSessionMessages(currentSessionId, updatedMessages);
  };

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const toggleTheme = () => {
    const modes: AppSettings["themeMode"][] = ["light", "dark", "auto"];
    const currentIndex = modes.indexOf(settings.themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setSettings({ ...settings, themeMode: nextMode });
  };

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-[var(--border-main)] flex items-center justify-between px-4 md:px-8 bg-[var(--bg-main)]/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-[var(--border-main)] rounded-xl text-[var(--text-muted)]"
            >
              <Menu className="w-5 h-5 md:w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2 md:gap-3 bg-[var(--bg-card)] border border-[var(--border-main)] p-1 md:p-1.5 rounded-xl md:rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 px-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest hidden sm:block">Online</span>
              </div>
              <div className="w-px h-4 bg-[var(--border-main)] mx-1" />
              <div className="relative group">
                <select
                  value={settings.provider === "gemini" ? settings.geminiModel : settings.ollamaModel}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    [settings.provider === "gemini" ? "geminiModel" : "ollamaModel"]: e.target.value 
                  })}
                  className="bg-transparent text-[10px] md:text-sm font-bold pr-6 md:pr-8 outline-none appearance-none cursor-pointer max-w-[80px] md:max-w-none truncate text-[var(--text-main)]"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m} className="bg-[var(--bg-card)]">{m}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 md:w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 md:p-2.5 hover:bg-[var(--border-main)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all border border-[var(--border-main)]"
              title={`Mode: ${settings.themeMode === "auto" ? "Otomatis" : settings.themeMode === "dark" ? "Gelap" : "Terang"}`}
            >
              {settings.themeMode === "dark" ? (
                <Moon className="w-4 h-4 md:w-5 h-5" />
              ) : settings.themeMode === "light" ? (
                <Sun className="w-4 h-4 md:w-5 h-5" />
              ) : (
                <div className="relative">
                  <Sun className="w-4 h-4 md:w-5 h-5 opacity-50" />
                  <Moon className="w-2.5 h-2.5 md:w-3 h-3 absolute -bottom-0.5 -right-0.5" />
                </div>
              )}
            </button>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Sesi</span>
              <span className="text-xs md:text-sm font-bold text-[var(--text-main)]/60 truncate max-w-[100px] md:max-w-[150px]">
                {currentSession?.title || "Chat Baru"}
              </span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 max-w-3xl mx-auto">
              <div className="space-y-4">
                <h2 className="text-4xl font-black tracking-tighter text-[var(--text-main)]">
                  Hai, {settings.user?.name.split(" ")[0]}. Ada yang bisa dibantu?
                </h2>
                <p className="text-[var(--text-muted)] leading-relaxed text-lg font-medium max-w-md mx-auto">
                  Tanyakan apa saja, mulai dari analisis dokumen hingga pembuatan gambar.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col max-w-5xl mx-auto">
              {messages.map((msg) => (
                <MessageItem 
                  key={msg.id} 
                  message={msg} 
                  settings={settings} 
                  onFeedback={handleFeedback}
                  onImageClick={setPreviewImage}
                />
              ))}
              <div ref={messagesEndRef} className="h-32" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)] to-transparent pt-12 pb-4">
          <ChatInput
            onSend={handleSend}
            onToggleVoice={() => setIsVoiceMode(true)}
            isLoading={isLoading}
            provider={settings.provider}
            isImageMode={isImageMode}
            onToggleImageMode={() => setIsImageMode(!isImageMode)}
          />
        </div>
      </main>

      <VoiceMode
        isOpen={isVoiceMode}
        onClose={() => setIsVoiceMode(false)}
        settings={settings}
      />

      {/* Image Preview Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -top-12 right-0 flex items-center gap-4">
                <a
                  href={previewImage}
                  download="barskuy-image.png"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-in { animation: fade-in 0.3s ease-out; }
        .zoom-in { animation: zoom-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
