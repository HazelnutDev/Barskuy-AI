import { Message, Attachment } from "../types";

export const openRouterService = {
  async getModels(apiKey: string) {
    if (!apiKey) return [];
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching OpenRouter models:", error);
      return [];
    }
  },

  async *streamChat(
    apiKey: string,
    model: string,
    messages: Message[],
    systemPrompt: string,
    attachments: Attachment[] = []
  ) {
    if (!apiKey) {
      yield "Error: OpenRouter API Key is missing. Please add it in settings.";
      return;
    }

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.attachments && msg.attachments.length > 0
          ? `${msg.content}\n\n[Attachments: ${msg.attachments.map(a => a.name).join(", ")}]`
          : msg.content,
      })),
    ];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Barskuy-AI",
        },
        body: JSON.stringify({
          model: model,
          messages: formattedMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "OpenRouter API error");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") break;

            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content || "";
              if (content) yield content;
            } catch (e) {
              console.error("Error parsing OpenRouter stream chunk:", e);
            }
          }
        }
      }
    } catch (error: any) {
      yield `Error: ${error.message}`;
    }
  },
};
