"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Clock, Users, Globe, Lock, Send,
  Plus, Tag, GitBranch, MessageCircle, BookHeart
} from "lucide-react";
import { MOCK_RECIPES, CHAT_SUGGESTIONS } from "@/lib/mock-data";

type Tab = "recipe" | "chat" | "memories" | "versions";

interface ChatMessage { role: "user" | "assistant"; text: string }

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const recipe = MOCK_RECIPES.find((r) => r.id === id);

  const [tab, setTab] = useState<Tab>("recipe");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: `I know this recipe well. Ask me anything about ${recipe?.title ?? "it"} — substitutions, technique, storage, or what Amma's notes mean.` }
  ]);
  const [newMemory, setNewMemory] = useState("");
  const [newComment, setNewComment] = useState("");
  const [memories, setMemories] = useState(recipe?.memories ?? []);
  const [comments, setComments] = useState(recipe?.comments ?? []);

  if (!recipe) return null;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "recipe", label: "Recipe", icon: <BookHeart className="w-3.5 h-3.5" /> },
    { key: "chat", label: "Chat", icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: "memories", label: "Memories", icon: <Tag className="w-3.5 h-3.5" /> },
    { key: "versions", label: "Versions", icon: <GitBranch className="w-3.5 h-3.5" /> },
  ];

  const handleChat = (msg?: string) => {
    const text = msg ?? chatInput;
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: "user", text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    // Simulated response
    setTimeout(() => {
      const responses: Record<string, string> = {
        "bedige": "Bedige chillies (also called byadgi) are a Karnatakan variety prized for deep red colour and mild heat. If unavailable, substitute with Kashmiri chillies — same colour benefit, similar mild heat. Do NOT use cayenne as a 1:1 swap, it will overwhelm the dish.",
        "substitute": "The most common substitution question for this recipe is the bedige chilli. Kashmiri chillies are the closest. For the dal ratios, you can shift slightly more toward chana dal if you want a nuttier, milder powder.",
        "long": "Stored in an airtight container away from moisture and direct light, this podi keeps for 3 months at room temperature. In the freezer it lasts up to a year — portion it before freezing so you're not defrosting the whole batch each time.",
        "grinder": "Yes, a high-speed blender works. The texture will be slightly finer than a stone grinder. Pulse rather than run continuously to avoid overheating the spices — heat activates the oils prematurely and shortens shelf life.",
        "methi": "Methi (fenugreek) added in large quantities creates bitterness. Small amounts add a complex, slightly bitter depth that balances the heat and tartness. Amma's ratio keeps it in the background — you feel it more than taste it.",
      };
      const key = Object.keys(responses).find((k) => text.toLowerCase().includes(k));
      const reply = key
        ? responses[key]
        : "That's a great question about this recipe. Based on what I know about South Indian spice blends and Amma's notes, the key principle here is balance between colour (bedige), heat (regular chilli), and depth (dal). What specifically would you like to explore?";
      setChatMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 800);
  };

  const handleAddMemory = () => {
    if (!newMemory.trim()) return;
    setMemories((prev) => [
      ...prev,
      { id: `m${Date.now()}`, author: "Pri", avatar: "P", text: newMemory, date: new Date().toISOString().split("T")[0], tagged_people: [] },
    ]);
    setNewMemory("");
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `c${Date.now()}`, author: "Pri", avatar: "P", text: newComment, date: new Date().toISOString().split("T")[0] },
    ]);
    setNewComment("");
  };

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-stone-100 z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            {recipe.is_public
              ? <span className="flex items-center gap-1 text-xs text-stone-400"><Globe className="w-3 h-3" /> Public</span>
              : <span className="flex items-center gap-1 text-xs text-stone-400"><Lock className="w-3 h-3" /> Private</span>}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${tab === key ? "bg-amber-600 text-white" : "text-stone-500 hover:bg-stone-100"}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        {/* Title block — always visible */}
        <h1 className="text-2xl font-serif text-stone-800 mb-1">{recipe.title}</h1>
        <p className="text-stone-500 text-sm mb-3">{recipe.description}</p>
        <div className="flex items-center gap-4 text-stone-400 text-xs mb-6">
          {recipe.cook_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.cook_time}</span>}
          {recipe.yield && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{recipe.yield}</span>}
          <span className="text-stone-300">·</span>
          <span>by {recipe.author_name}</span>
          <span className="ml-auto flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />{comments.length}
            <Tag className="w-3 h-3 ml-2" />{memories.length}
          </span>
        </div>

        {/* ── RECIPE TAB ── */}
        {tab === "recipe" && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Ingredients</h2>
              <div className="space-y-5">
                {recipe.ingredients.map((group, gi) => (
                  <div key={gi}>
                    {group.section && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">{group.section}</p>
                    )}
                    <ul className="space-y-2">
                      {group.items.map((ing, i) => (
                        <li key={i} className="flex items-start gap-2 text-stone-700 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700">
                    <span className="font-serif text-amber-600 text-lg leading-snug shrink-0 w-5">{i + 1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {recipe.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-2">Amma&apos;s notes</p>
                <p className="text-stone-600 text-sm leading-relaxed italic">{recipe.notes}</p>
              </div>
            )}

            {/* Comments */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Comments</h2>
              <div className="space-y-3 mb-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600 shrink-0">{c.avatar}</div>
                    <div className="bg-white rounded-xl border border-stone-100 px-3 py-2 flex-1">
                      <p className="text-xs font-medium text-stone-600 mb-0.5">{c.author}</p>
                      <p className="text-sm text-stone-700">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm bg-white border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
                />
                <button onClick={handleAddComment} className="bg-amber-600 text-white rounded-xl px-3 hover:bg-amber-700 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {tab === "chat" && (
          <div className="flex flex-col" style={{ minHeight: "60vh" }}>
            <p className="text-xs text-stone-400 mb-4 text-center">Ask anything about this recipe — substitutions, technique, storage, what the notes mean.</p>

            {/* Suggestion chips */}
            {chatMessages.length <= 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {CHAT_SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleChat(s)} className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full hover:bg-amber-50 hover:text-amber-700 transition-colors text-left">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="space-y-3 flex-1 mb-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">H</div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed
                    ${m.role === "user" ? "bg-amber-600 text-white rounded-tr-sm" : "bg-white border border-stone-100 text-stone-700 rounded-tl-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder="Ask about this recipe..."
                className="flex-1 text-sm bg-white border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
              />
              <button onClick={() => handleChat()} className="bg-amber-600 text-white rounded-xl px-3 hover:bg-amber-700 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── MEMORIES TAB ── */}
        {tab === "memories" && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500">Stories, moments, and people connected to this recipe. These live alongside it forever.</p>

            {memories.map((m) => (
              <div key={m.id} className="bg-white border border-stone-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600">{m.avatar}</div>
                  <div>
                    <p className="text-xs font-medium text-stone-700">{m.author}</p>
                    <p className="text-xs text-stone-400">{m.date}</p>
                  </div>
                </div>
                <p className="text-stone-700 text-sm leading-relaxed italic">&ldquo;{m.text}&rdquo;</p>
                {m.tagged_people.length > 0 && (
                  <div className="flex gap-1.5 mt-3">
                    {m.tagged_people.map((p) => (
                      <span key={p} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />{p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Add memory */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1"><Plus className="w-3 h-3" /> Add a memory</p>
              <textarea
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Share a story, a moment, a memory connected to this recipe..."
                rows={3}
                className="w-full text-sm bg-white border border-amber-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none"
              />
              <button onClick={handleAddMemory} className="mt-2 w-full bg-amber-600 text-white text-sm py-2.5 rounded-xl hover:bg-amber-700 transition-colors font-medium">
                Save memory
              </button>
            </div>
          </div>
        )}

        {/* ── VERSIONS TAB ── */}
        {tab === "versions" && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500">Different people make this differently. Each version is a branch of the same root recipe.</p>

            {recipe.versions.map((v, i) => (
              <div key={v.id} className={`bg-white border rounded-2xl p-4 ${i === 0 ? "border-amber-200" : "border-stone-100"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                      <p className="font-medium text-stone-800 text-sm">{v.label}</p>
                      {i === 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Original</span>}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">by {v.author} · {v.date}</p>
                  </div>
                </div>
                <p className="text-stone-600 text-sm italic">{v.notes}</p>
              </div>
            ))}

            {/* Add version */}
            <button className="w-full border-2 border-dashed border-stone-200 rounded-2xl p-4 text-stone-400 text-sm flex items-center justify-center gap-2 hover:border-amber-300 hover:text-amber-600 transition-colors">
              <Plus className="w-4 h-4" /> Save my version of this recipe
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
