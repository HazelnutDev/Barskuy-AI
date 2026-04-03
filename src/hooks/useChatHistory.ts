import { useState, useEffect } from "react";
import { ChatSession, Message } from "../types";

const STORAGE_KEY = "barskuy_ai_sessions";

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const updateSessionMessages = (sessionId: string, messagesOrUpdater: Message[] | ((prev: Message[]) => Message[])) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const messages = typeof messagesOrUpdater === "function" ? messagesOrUpdater(s.messages) : messagesOrUpdater;
          // Update title based on first user message if it's still default
          let title = s.title;
          if (title === "New Conversation" && messages.length > 0) {
            const firstUserMsg = messages.find((m) => m.role === "user");
            if (firstUserMsg) {
              title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
            }
          }
          return { ...s, messages, title, updatedAt: Date.now() };
        }
        return s;
      })
    );
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    updateSessionMessages,
    deleteSession,
  };
}
