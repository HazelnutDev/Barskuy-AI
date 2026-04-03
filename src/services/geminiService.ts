import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Message, Attachment } from "../types";

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  private getClient(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Gemini API Key is missing. Please set it in settings.");
    }
    // Re-initialize if the key has changed
    if (!this.ai || (this.ai as any).apiKey !== key) {
      this.ai = new GoogleGenAI({ apiKey: key });
    }
    return this.ai;
  }

  async *streamChat(
    apiKey: string,
    modelName: string,
    history: Message[],
    systemInstruction: string,
    attachments: Attachment[] = []
  ) {
    const ai = this.getClient(apiKey);
    // Convert history to Gemini format, excluding the last message (which is the current query)
    const geminiHistory = history.slice(0, -1).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const chat = ai.chats.create({
      model: modelName,
      config: { systemInstruction },
      history: geminiHistory as any
    });

    // Prepare parts for the latest message
    const lastMessage = history[history.length - 1];
    const parts: any[] = [{ text: lastMessage.content }];

    // Add attachments to the parts
    for (const att of attachments) {
      if (att.type === "image" && att.url) {
        const base64 = att.url.split(",")[1];
        parts.push({
          inlineData: {
            data: base64,
            mimeType: "image/png",
          },
        });
      } else if (att.content) {
        parts.push({ text: `Context from file ${att.name}:\n${att.content}` });
      }
    }

    const result = await chat.sendMessageStream({
      message: parts,
    });

    for await (const chunk of result) {
      const response = chunk as GenerateContentResponse;
      yield response.text || "";
    }
  }

  async generateImage(apiKey: string, prompt: string) {
    const ai = this.getClient(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  }
}

export const geminiService = new GeminiService();
