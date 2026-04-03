import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { 
  Bot, FileText, ImageIcon, Copy, Check, Terminal, Download, 
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  ThumbsUp, ThumbsDown, Info, Maximize2
} from "lucide-react";
import { Message, AppSettings } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

interface MessageItemProps {
  message: Message;
  settings: AppSettings;
  onFeedback?: (id: string, type: "positive" | "negative") => void;
  onImageClick?: (url: string) => void;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export const MessageItem: React.FC<MessageItemProps> = ({ message, settings, onFeedback, onImageClick }) => {
  const [copied, setCopied] = React.useState(false);
  const [showSummary, setShowSummary] = React.useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract chart data from content if present
  const renderChart = () => {
    const chartMatch = message.content.match(/```json_chart\s*([\s\S]*?)\s*```/);
    if (!chartMatch) return null;

    try {
      const chartConfig = JSON.parse(chartMatch[1]);
      const { type, data, title } = chartConfig;

      return (
        <div className="my-6 p-4 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {title && <h4 className="text-sm font-bold text-white/80 mb-4 text-center">{title}</h4>}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {type === "bar" ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1a1c23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : type === "line" ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1a1c23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1a1c23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      );
    } catch (e) {
      return null;
    }
  };

  // Clean content from chart JSON for markdown rendering
  const displayContent = message.content.replace(/```json_chart\s*[\s\S]*?\s*```/g, "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 p-4 md:p-6 transition-colors",
        isUser ? "flex-row-reverse" : "bg-[var(--bg-main)]/50"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden border border-[var(--border-main)]",
        isUser ? "bg-blue-600" : "bg-gradient-to-br from-purple-600 to-blue-600"
      )}>
        {isUser ? (
          <img src={settings.user?.avatar} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
      </div>

      <div className={cn(
        "flex-1 space-y-4 overflow-hidden max-w-[90%] md:max-w-[80%]",
        isUser && "text-right"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          isUser ? "flex-row-reverse" : "justify-between"
        )}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {isUser ? "Anda" : "Barskuy-AI"} {message.model && `• ${message.model}`}
          </span>
          <div className="flex items-center gap-1">
            {!isUser && message.summary && (
              <button
                onClick={() => setShowSummary(!showSummary)}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  showSummary ? "bg-blue-600/20 text-blue-400" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-main)]"
                )}
                title="Ringkasan Percakapan"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => copyToClipboard(message.content)}
              className="p-1.5 hover:bg-[var(--border-main)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
              title="Salin Pesan"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSummary && message.summary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-4 mb-4 text-left">
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                  <Info className="w-3 h-3" />
                  <span>Ringkasan Jawaban</span>
                </div>
                <p className="text-sm text-[var(--text-main)]/70 leading-relaxed">{message.summary}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {message.thinking && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl p-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <Terminal className="w-3 h-3" />
              <span>Proses Berpikir</span>
              {message.isStreaming && <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />}
            </div>
            <p className="text-sm text-[var(--text-muted)] italic leading-relaxed whitespace-pre-wrap">{message.thinking}</p>
          </div>
        )}

        <div className={cn(
          "prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent text-left",
          isUser ? "bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl rounded-tr-none" : "",
          !isUser && "prose-p:text-[var(--text-main)] prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-li:text-[var(--text-main)]"
        )}>
          {message.isStreaming && !message.content && !message.thinking ? (
            <div className="flex items-center gap-1 py-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
            </div>
          ) : (
            <>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <div className="relative group/code my-4 rounded-xl overflow-hidden border border-[var(--border-main)] shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border-main)]">
                          <div className="flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{match[1]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => copyToClipboard(String(children).replace(/\n$/, ""))}
                              className="p-1 hover:bg-[var(--border-main)] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1 hover:bg-[var(--border-main)] rounded text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: "1.5rem", fontSize: "0.875rem", background: "#0f1115" }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={cn("bg-[var(--border-main)] px-1.5 py-0.5 rounded text-blue-400", className)} {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-6 overflow-x-auto rounded-xl border border-[var(--border-main)]">
                        <table className="w-full text-sm text-left border-collapse">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-[var(--bg-card)] text-[var(--text-muted)] uppercase text-[10px] font-bold tracking-widest">{children}</thead>;
                  },
                  th({ children }) {
                    return <th className="px-4 py-3 border-b border-[var(--border-main)]">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="px-4 py-3 border-b border-[var(--border-main)] text-[var(--text-main)]/70">{children}</td>;
                  }
                }}
              >
                {displayContent}
              </ReactMarkdown>
              {renderChart()}
            </>
          )}
        </div>

        {!isUser && !message.isStreaming && (
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFeedback?.(message.id, "positive")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  message.feedback === "positive" ? "bg-green-500/20 text-green-400" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-main)]"
                )}
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onFeedback?.(message.id, "negative")}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  message.feedback === "negative" ? "bg-red-500/20 text-red-400" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--border-main)]"
                )}
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className={cn("flex flex-wrap gap-3 pt-2", isUser && "justify-end")}>
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex flex-col gap-2 p-2 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-xs text-[var(--text-muted)] hover:bg-[var(--border-main)] transition-all max-w-[240px]"
              >
                {att.type === "image" && att.url ? (
                  <div 
                    className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border-main)] cursor-zoom-in"
                    onClick={() => onImageClick?.(att.url!)}
                  >
                    <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageClick?.(att.url!);
                        }}
                        className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all shadow-xl"
                        title="Perbesar Gambar"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(att.url!, att.name);
                        }}
                        className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-all shadow-xl"
                        title="Unduh Gambar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="truncate max-w-[150px] font-medium text-[var(--text-main)]">{att.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-1">
                  {att.type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> : <FileText className="w-3.5 h-3.5 text-purple-400" />}
                  <span className="truncate flex-1 font-medium text-[var(--text-muted)]">{att.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
