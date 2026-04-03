import { Message, Attachment } from "../types";

export class OllamaService {
  async *streamChat(
    baseUrl: string,
    model: string,
    history: Message[],
    systemPrompt: string,
    attachments: Attachment[] = []
  ) {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => {
        let content = m.content;
        // If there are file contents, append them to the user message
        if (m.role === "user" && m.attachments) {
          const fileContext = m.attachments
            .filter((a) => a.content)
            .map((a) => `[File: ${a.name}]\n${a.content}`)
            .join("\n\n");
          if (fileContext) {
            content = `${content}\n\nContext from files:\n${fileContext}`;
          }
        }
        
        const msg: any = { role: m.role, content };
        
        // Add images if any
        const images = m.attachments
          ?.filter((a) => a.type === "image" && a.url)
          .map((a) => a.url!.split(",")[1]);
          
        if (images && images.length > 0) {
          msg.images = images;
        }
        
        return msg;
      }),
    ];

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ollama error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              yield json.message.content;
            }
            if (json.done) return;
          } catch (e) {
            console.error("Error parsing Ollama stream", e);
          }
        }
      }
    } catch (error: any) {
      console.error("Ollama connection failed", error);
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        yield `⚠️ **Connection Error**: Could not reach Ollama at \`${baseUrl}\`. 

**Possible fixes:**
1. **CORS Issue**: Run Ollama with \`OLLAMA_ORIGINS="*" ollama serve\` (Restart Ollama after setting this).
2. **Not Running**: Ensure Ollama is actually running on your machine.
3. **Mixed Content**: If this app is on HTTPS and Ollama is on HTTP, your browser might block it. Try using a tunnel like Ngrok or Cloudflare Tunnel.`;
      } else {
        yield `❌ **Ollama Error**: ${error.message || "Unknown error occurred"}`;
      }
    }
  }

  async getModels(baseUrl: string) {
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.models || [];
    } catch (e) {
      return [];
    }
  }
}

export const ollamaService = new OllamaService();
