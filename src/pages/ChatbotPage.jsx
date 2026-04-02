import React, { useState } from "react";
import ChatWindow from "../components/ChatWindow.jsx";
import { postChat } from "../services/api.js";

export default function ChatbotPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend(message) {
    setLoading(true);
    setError(null);
    try {
      const res = await postChat(message);
      return res.reply || "No response received.";
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Chatbot</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ask ForensiAI to analyze events, summarize incidents, and recommend next steps.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-high/30 bg-high/10 p-4 text-sm text-slate-200">
          Chat service unreachable. Using mock responses when possible.
        </div>
      ) : null}

      <ChatWindow onSend={handleSend} loading={loading} />
    </div>
  );
}

