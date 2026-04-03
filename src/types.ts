export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  thinking?: string;
  attachments?: Attachment[];
  isStreaming?: boolean;
  model?: string;
  summary?: string;
  chartData?: any[];
  feedback?: "positive" | "negative";
}

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "pdf" | "docx" | "text";
  url?: string;
  content?: string; // For text/pdf/docx extracted content
  size: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  ollamaUrl: string;
  ollamaModel: string;
  llamaCppUrl: string;
  llamaCppModel: string;
  geminiModel: string;
  openRouterKey: string;
  openRouterModel: string;
  provider: "gemini" | "ollama" | "llama-cpp" | "openrouter";
  systemPrompt: string;
  memory: string;
  themeMode: "auto" | "dark" | "light";
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  ollamaUrl: "http://127.0.0.1:11434",
  ollamaModel: "deepseek-r1:7b",
  llamaCppUrl: "http://127.0.0.1:8080",
  llamaCppModel: "default",
  geminiModel: "gemini-3-flash-preview",
  openRouterKey: "",
  openRouterModel: "google/gemini-2.0-flash-001",
  provider: "gemini",
  systemPrompt: "Anda adalah Barskuy-AI, asisten AI yang sangat canggih dan membantu. Anda dapat memproses dokumen, gambar, dan memberikan penalaran mendalam jika diperlukan. Berikan jawaban yang akurat, profesional, dan mudah dipahami dalam Bahasa Indonesia. Jika Anda memberikan data perbandingan atau statistik, gunakan format tabel Markdown. Jika Anda memberikan data numerik yang cocok untuk grafik, sertakan blok JSON di akhir pesan Anda dengan format: ```json_chart {\"type\": \"bar|line|pie\", \"data\": [...]} ```.",
  memory: "",
  themeMode: "auto",
  user: {
    name: "Akbar Dirgantara",
    email: "akbardirgantara762@gmail.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Akbar",
  },
};
