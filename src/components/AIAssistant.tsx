"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Message { role: "user" | "assistant"; content: string }

function getOpener(): string {
  const h = new Date().getHours();
  if (h < 6)  return "Still up? Tell me what you're craving.";
  if (h < 12) return "Morning. What are we making today?";
  if (h < 17) return "What's for dinner tonight?";
  if (h < 21) return "What's on the table tonight?";
  return "Late night kitchen run? I know your recipes.";
}

const CHIPS = [
  "What can I cook tonight?",
  "Search my recipes",
  "Help me plan a menu",
  "Add a new recipe",
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipeContext, setRecipeContext] = useState<string[]>([]);
  const [opener] = useState(getOpener);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load user's recipe titles for context
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("recipes")
        .select("title")
        .eq("user_id", user.id)
        .limit(50);
      setRecipeContext((data ?? []).map((r: { title: string }) => r.title));
    };
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, recipeContext }),
      });
      const data = await res.json();
      if (data.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-40 w-13 h-13 bg-amber-500 hover:bg-amber-400 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
          style={{ width: 52, height: 52 }}
          aria-label="Open Heirloom assistant"
        >
          📜
        </button>
      )}

      {/* Chat overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-amber-50 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-xl shadow-sm">
                📜
              </div>
              <div>
                <p className="font-serif text-stone-800 text-base leading-tight">Heirloom</p>
                <p className="text-xs text-amber-700">Your kitchen companion</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* Opener — always shown */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-base shrink-0">📜</div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm">
                <p className="text-stone-800 text-sm leading-relaxed">{opener}</p>
              </div>
            </div>

            {/* Suggestion chips — shown before first message */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-11">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="text-xs bg-white border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Conversation */}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-base shrink-0">📜</div>
                )}
                <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed shadow-sm
                  ${m.role === "user"
                    ? "bg-amber-600 text-white rounded-tr-sm"
                    : "bg-white text-stone-800 rounded-tl-sm"}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-base shrink-0">📜</div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-4 border-t border-amber-100 bg-amber-50 flex gap-2 pb-safe">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask anything..."
              className="flex-1 bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-stone-800"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="bg-amber-600 text-white rounded-xl px-4 hover:bg-amber-700 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
