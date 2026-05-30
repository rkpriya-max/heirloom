"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus } from "lucide-react";
import { MOCK_RECIPES } from "@/lib/mock-data";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelectedRecipes((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
          <ChevronLeft className="w-4 h-4" /> Cancel
        </button>
        <h1 className="font-serif text-stone-800">New event</h1>
        <button onClick={() => router.push("/events/ev1")} className="text-sm text-amber-600 font-medium">Create</button>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Event name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kavya's Baby Shower"
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the occasion?" rows={2}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 resize-none" />
        </div>

        {/* Recipe picker */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-400">Menu — pick recipes</label>
            {selectedRecipes.length > 0 && (
              <span className="text-xs text-amber-600 font-medium">{selectedRecipes.length} selected</span>
            )}
          </div>
          <div className="space-y-2">
            {MOCK_RECIPES.map((r) => {
              const selected = selectedRecipes.includes(r.id);
              return (
                <button key={r.id} onClick={() => toggle(r.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left
                    ${selected ? "bg-amber-50 border-amber-300" : "bg-white border-stone-100 hover:border-stone-200"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                    ${selected ? "bg-amber-600 border-amber-600" : "border-stone-300"}`}>
                    {selected && <Plus className="w-3 h-3 text-white rotate-45" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm">{r.title}</p>
                    <p className="text-xs text-stone-400">{r.yield}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => router.push("/events/ev1")}
          className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors">
          Create event
        </button>
      </div>
    </main>
  );
}
