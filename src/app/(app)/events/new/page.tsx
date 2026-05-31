"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Recipe { id: string; title: string; yield: string | null }

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("recipes")
        .select("id, title, yield")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRecipes((data ?? []) as Recipe[]);
    };
    load();
  }, [router]);

  const toggle = (id: string) =>
    setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleCreate = async () => {
    if (!title.trim()) { setError("Event name is required."); return; }
    if (!date) { setError("Date is required."); return; }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        host_id: user.id,
        title: title.trim(),
        event_date: date,
        description: description.trim() || null,
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    if (eventError || !event) {
      setError(eventError?.message ?? "Failed to create event — unknown error.");
      setSaving(false);
      return;
    }

    if (selectedIds.length > 0) {
      await supabase.from("event_recipes").insert(
        selectedIds.map((recipeId, i) => ({ event_id: event.id, recipe_id: recipeId, sort_order: i }))
      );
    }

    router.push(`/events/${event.id}`);
  };

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
          <ChevronLeft className="w-4 h-4" /> Cancel
        </button>
        <h1 className="font-serif text-stone-800">New event</h1>
        <button onClick={handleCreate} disabled={saving} className="text-sm text-amber-600 font-medium disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Event name *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kavya's Baby Shower"
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Date *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the occasion?" rows={2}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 resize-none" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Dietary needs, venue, anything worth noting"
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Menu — pick recipes
            </label>
            {selectedIds.length > 0 && (
              <span className="text-xs text-amber-600 font-medium">{selectedIds.length} selected</span>
            )}
          </div>

          {recipes.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-6">
              No recipes yet.{" "}
              <button onClick={() => router.push("/recipes/new")} className="text-amber-600">Add one first →</button>
            </p>
          ) : (
            <div className="space-y-2">
              {recipes.map((r) => {
                const selected = selectedIds.includes(r.id);
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
                      {r.yield && <p className="text-xs text-stone-400">{r.yield}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={handleCreate} disabled={saving}
          className="w-full bg-stone-800 text-white py-4 rounded-xl font-medium text-sm hover:bg-stone-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create event"}
        </button>
      </div>
    </main>
  );
}
