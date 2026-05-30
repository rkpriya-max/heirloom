"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Globe, Lock, ChevronRight } from "lucide-react";
import { MOCK_RECIPES } from "@/lib/mock-data";

const FILTERS = ["All", "Tamil", "Spice blend", "Breakfast", "Festivals"];

export default function RecipesPage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = MOCK_RECIPES.filter((r) => {
    const matchFilter = filter === "All" || r.tags.includes(filter) || r.category === filter;
    const matchQuery = !query || r.title.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  return (
    <main className="max-w-lg mx-auto px-4 pt-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-stone-800">Recipes</h1>
        <Link href="/recipes/new" className="bg-amber-600 text-white rounded-full p-2 hover:bg-amber-700 transition-colors">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search recipes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${filter === f ? "bg-amber-600 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      <div className="space-y-3">
        {filtered.map((r) => (
          <Link key={r.id} href={`/recipes/${r.id}`} className="flex gap-4 bg-white rounded-2xl border border-stone-100 p-4 hover:border-stone-200 transition-colors">
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">🍲</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-stone-800 text-sm leading-snug">{r.title}</p>
                {r.is_public
                  ? <Globe className="w-3.5 h-3.5 text-stone-300 shrink-0 mt-0.5" />
                  : <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0 mt-0.5" />}
              </div>
              <p className="text-xs text-stone-400 mt-1 line-clamp-1">{r.description}</p>
              <div className="flex items-center gap-2 mt-2">
                {r.tags.map((t) => (
                  <span key={t} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300 shrink-0 self-center" />
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-400 text-sm">No recipes found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
