import { Message, Attachment } from "../types";

export class LlamaCppService {
  async *streamChat(
    baseUrl: string,
    history: Message[],
    systemPrompt: string,
    attachments: Attachment[] = []
  ) {
    // Format prompt for llama.cpp (usually expects a single prompt string or ChatML)
    // We'll use the /v1/chat/completions OpenAI compatible endpoint if available
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => {
        let content = m.content;
        if (m.role === "user" && m.attachments) {
          const fileContext = m.attachments
            .filter((a) => a.content)
            .map((a) => `[File: ${a.name}]\n${a.content}`)
            .join("\n\n");
          if (fileContext) {
            content = `${content}\n\nContext from files:\n${fileContext}`;
          }
        }
        return { role: m.role, content };
      }),
    ];

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        // Fallback to /completion if /v1/chat/completions fails
        return this.streamLegacyCompletion(baseUrl, history, systemPrompt);
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
          const cleanLine = line.replace(/^data: /, "").trim();
          if (!cleanLine || cleanLine === "[DONE]") continue;

          try {
            const json = JSON.parse(cleanLine);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (error: any) {
      console.error("Llama.cpp connection failed", error);
      yield `⚠️ **Connection Error**: Could not reach llama.cpp at \`${baseUrl}\`. 

**How to fix:**
1. **Run llama-server**: Ensure you are running \`llama-server\` with the \`--host 0.0.0.0\` flag.
2. **CORS**: You might need to allow CORS in your browser or run with a proxy.
3. **GPU Acceleration**: Use \`-ngl 99\` to offload all layers to GPU.`;
    }
  }

  private async *streamLegacyCompletion(baseUrl: string, history: Message[], systemPrompt: string) {
    // Basic prompt formatting for legacy /completion endpoint
    let prompt = `${systemPrompt}\n\n`;
    for (const msg of history) {
      prompt += `${msg.role === "user" ? "### Instruction" : "### Response"}:\n${msg.content}\n\n`;
    }
    prompt += "### Response:\n";

    try {
      const response = await fetch(`${baseUrl}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          stream: true,
          n_predict: 2048,
        }),
      });

      if (!response.ok) throw new Error(`Llama.cpp error: ${response.statusText}`);

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
          const cleanLine = line.replace(/^data: /, "").trim();
          if (!cleanLine) continue;

          try {
            const json = JSON.parse(cleanLine);
            if (json.content) {
              yield json.content;
            }
            if (json.stop) return;
          } catch (e) {}
        }
      }
    } catch (e: any) {
      yield `❌ **Llama.cpp Error**: ${e.message}`;
    }
  }

  async getModels(baseUrl: string) {
    try {
      // llama.cpp usually serves one model, we can try to get its name from /props or /v1/models
      const response = await fetch(`${baseUrl}/v1/models`);
      if (!response.ok) return [{ name: "Default Model" }];
      const data = await response.json();
      return data.data.map((m: any) => ({ name: m.id })) || [{ name: "Default Model" }];
    } catch (e) {
      return [{ name: "Default Model" }];
    }
  }
}

export const llamaCppService = new LlamaCppService();
