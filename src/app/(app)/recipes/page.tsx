"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Globe, Lock, ChevronRight, Trash2, CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  cover_image_url: string | null;
  recipe_tags: { tag: string }[];
  recipe_ingredients: { items: string[] }[];
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("recipes")
        .select("id, title, description, is_public, created_at, cover_image_url, recipe_tags(tag), recipe_ingredients(items)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setRecipes((data ?? []) as Recipe[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("recipes").delete().in("id", Array.from(selected));
    setRecipes((prev) => prev.filter((r) => !selected.has(r.id)));
    exitSelectMode();
    setDeleting(false);
  };

  const allTags = Array.from(new Set(recipes.flatMap((r) => r.recipe_tags.map((t) => t.tag))));
  const filters = ["All", ...allTags];

  const filtered = recipes.filter((r) => {
    const matchFilter = filter === "All" || r.recipe_tags.some((t) => t.tag === filter);
    const q = query.toLowerCase();
    const matchQuery = !query ||
      r.title.toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q) ||
      r.recipe_tags.some((t) => t.tag.toLowerCase().includes(q)) ||
      r.recipe_ingredients.some((section) => section.items.some((item) => item.toLowerCase().includes(q)));
    return matchFilter && matchQuery;
  });

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-10">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-stone-200 rounded w-32" />
          <div className="h-12 bg-stone-200 rounded-xl" />
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-stone-200 rounded-2xl" />)}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 pt-10 pb-28">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-serif text-stone-800">Recipes</h1>
        <div className="flex items-center gap-2">
          {recipes.length > 0 && (
            <button
              onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1"
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          {!selectMode && (
            <Link href="/recipes/new" className="bg-amber-600 text-white rounded-full p-2 hover:bg-amber-700 transition-colors">
              <Plus className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      <p className="text-stone-400 text-sm mb-5">All your recipes, gathered in one place. Search by name, ingredient, or tag — or just browse and see what catches your eye.</p>

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

      {filters.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {filters.map((f) => (
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
      )}

      {selectMode && filtered.length > 0 && (
        <div className="flex items-center justify-between mb-3 px-1">
          <button onClick={toggleAll} className="text-xs text-amber-700 font-medium hover:text-amber-800 transition-colors">
            {selected.size === filtered.length ? "Deselect all" : "Select all"}
          </button>
          <span className="text-xs text-stone-400">{selected.size} selected</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          {recipes.length === 0 ? (
            <>
              <div className="text-4xl mb-3">📋</div>
              <p className="text-stone-600 font-medium mb-1">No recipes yet</p>
              <p className="text-stone-400 text-sm mb-4">Scan a handwritten card or type one in.</p>
              <Link href="/recipes/new" className="text-amber-600 text-sm font-medium">Add your first recipe →</Link>
            </>
          ) : (
            <p className="text-stone-400 text-sm">No recipes match your search.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const isSelected = selected.has(r.id);
            return (
              <div
                key={r.id}
                onClick={selectMode ? () => toggleSelect(r.id) : undefined}
                className={`flex gap-3 bg-white rounded-2xl border p-4 transition-all
                  ${selectMode ? "cursor-pointer" : ""}
                  ${isSelected ? "border-amber-400 bg-amber-50/40" : "border-stone-100 hover:border-stone-200"}`}
              >
                {selectMode && (
                  <div className="flex items-center shrink-0">
                    {isSelected
                      ? <CheckCircle2 className="w-5 h-5 text-amber-600" />
                      : <Circle className="w-5 h-5 text-stone-300" />}
                  </div>
                )}

                {selectMode ? (
                  <div className="flex gap-3 flex-1 min-w-0">
                    {r.cover_image_url
                      ? <img src={r.cover_image_url} alt={r.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      : <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">🍲</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm leading-snug">{r.title}</p>
                      {r.description && <p className="text-xs text-stone-400 mt-1 line-clamp-1">{r.description}</p>}
                      {r.recipe_tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {r.recipe_tags.slice(0, 3).map(({ tag }) => (
                            <span key={tag} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <Link href={`/recipes/${r.id}`} className="flex gap-3 flex-1 min-w-0">
                      {r.cover_image_url
                        ? <img src={r.cover_image_url} alt={r.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        : <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">🍲</div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="font-medium text-stone-800 text-sm leading-snug flex-1 min-w-0">{r.title}</p>
                          {r.is_public
                            ? <Globe className="w-3.5 h-3.5 text-stone-300 shrink-0 mt-0.5" />
                            : <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0 mt-0.5" />}
                        </div>
                        {r.description && <p className="text-xs text-stone-400 mt-1 line-clamp-1">{r.description}</p>}
                        {r.recipe_tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {r.recipe_tags.slice(0, 3).map(({ tag }) => (
                              <span key={tag} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectMode(true); setSelected(new Set([r.id])); }}
                        className="p-1.5 text-stone-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                        aria-label="Delete recipe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-stone-300" />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-50">
          <div className="bg-stone-900 text-white rounded-2xl shadow-xl flex items-center gap-3 px-5 py-3.5 w-full max-w-lg">
            <span className="flex-1 text-sm font-medium">{selected.size} recipe{selected.size !== 1 ? "s" : ""} selected</span>
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
