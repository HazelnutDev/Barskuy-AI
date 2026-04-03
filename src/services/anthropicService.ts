import { Message, Attachment } from "../types";

export const anthropicService = {
  async getModels(apiKey: string) {
    if (!apiKey) return [];
    // Anthropic doesn't have a public models endpoint that's easy to use without SDK
    // We'll return a static list of popular models
    return [
      { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    ];
  },

  async *streamChat(
    apiKey: string,
    model: string,
    messages: Message[],
    systemPrompt: string,
    attachments: Attachment[] = []
  ) {
    if (!apiKey) {
      yield "Error: Anthropic API Key is missing. Please add it in settings.";
      return;
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.attachments && msg.attachments.length > 0
        ? `${msg.content}\n\n[Attachments: ${msg.attachments.map(a => a.name).join(", ")}]`
        : msg.content,
    }));

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "dangerously-allow-browser": "true", // Note: This is usually for their SDK, but we're doing raw fetch
        },
        body: JSON.stringify({
          model: model,
          system: systemPrompt,
          messages: formattedMessages,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Anthropic API error");
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
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "content_block_delta") {
                yield data.delta.text || "";
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      yield `Error: ${error.message}`;
    }
  },
};
