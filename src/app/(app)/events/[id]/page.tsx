"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, UserPlus, Trash2 } from "lucide-react";
import { MOCK_EVENTS, MOCK_RECIPES } from "@/lib/mock-data";

export default function EventDetailPage() {
  const router = useRouter();
  const event = MOCK_EVENTS[0];
  const [menuIds, setMenuIds] = useState<string[]>(event.menu_recipe_ids);
  const [showAddRecipe, setShowAddRecipe] = useState(false);

  const menuRecipes = MOCK_RECIPES.filter((r) => menuIds.includes(r.id));
  const availableToAdd = MOCK_RECIPES.filter((r) => !menuIds.includes(r.id));

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="font-serif text-stone-800">Event</h1>
          <div />
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Event header */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-xl font-serif text-stone-800">{event.title}</h2>
            <span className="text-2xl">🎉</span>
          </div>
          <p className="text-amber-600 text-sm font-medium mb-2">
            {new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-stone-500 text-sm">{event.description}</p>
          {event.notes && <p className="text-stone-400 text-xs mt-2 italic">{event.notes}</p>}
        </div>

        {/* Guests */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Guests ({event.guests.length})</h2>
            <button className="flex items-center gap-1 text-xs text-amber-600"><UserPlus className="w-3 h-3" /> Invite</button>
          </div>
          <div className="flex items-center gap-2">
            {event.guests.map((g, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-sm font-medium text-stone-700">{g.avatar}</div>
                <p className="text-[10px] text-stone-400">{g.name}</p>
              </div>
            ))}
            <button className="w-10 h-10 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 hover:border-amber-400 hover:text-amber-400 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Menu */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Menu ({menuRecipes.length} recipes)</h2>
            <button onClick={() => setShowAddRecipe(true)} className="flex items-center gap-1 text-xs text-amber-600">
              <Plus className="w-3 h-3" /> Add recipe
            </button>
          </div>
          <div className="space-y-2">
            {menuRecipes.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg shrink-0">🍲</div>
                <div className="flex-1 min-w-0">
                  <Link href={`/recipes/${r.id}`} className="font-medium text-stone-800 text-sm hover:text-amber-700">{r.title}</Link>
                  <p className="text-xs text-stone-400">{r.yield} · {r.cook_time}</p>
                </div>
                <button onClick={() => setMenuIds((p) => p.filter((id) => id !== r.id))} className="text-stone-200 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {menuRecipes.length === 0 && (
              <div className="text-center py-8 text-stone-400 text-sm">
                No recipes in the menu yet. Add some.
              </div>
            )}
          </div>
        </section>

        {/* Serving summary */}
        {menuRecipes.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Menu summary</p>
            <p className="text-stone-600 text-sm">{menuRecipes.length} dishes · for {event.guests.length} guests</p>
            <ul className="mt-2 space-y-0.5">
              {menuRecipes.map((r) => (
                <li key={r.id} className="text-xs text-stone-500 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                  {r.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add recipe modal */}
      {showAddRecipe && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowAddRecipe(false)}>
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-stone-800 text-lg mb-4">Add to menu</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {availableToAdd.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setMenuIds((p) => [...p, r.id]); setShowAddRecipe(false); }}
                  className="w-full flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 hover:bg-amber-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg shrink-0">🍲</div>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">{r.title}</p>
                    <p className="text-xs text-stone-400">{r.yield}</p>
                  </div>
                </button>
              ))}
              {availableToAdd.length === 0 && (
                <p className="text-center text-stone-400 text-sm py-4">All your recipes are already in this menu.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
