"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Globe, Lock, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  cover_image_url: string | null;
  recipe_tags: { tag: string }[];
}

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("recipes")
        .select("id, title, description, is_public, created_at, cover_image_url, recipe_tags(tag)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setRecipes((data ?? []) as Recipe[]);
      setLoading(false);
    };
    load();
  }, [router]);

  const allTags = Array.from(new Set(recipes.flatMap((r) => r.recipe_tags.map((t) => t.tag))));
  const filters = ["All", ...allTags];

  const filtered = recipes.filter((r) => {
    const matchFilter = filter === "All" || r.recipe_tags.some((t) => t.tag === filter);
    const matchQuery = !query || r.title.toLowerCase().includes(query.toLowerCase());
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
    <main className="max-w-lg mx-auto px-4 pt-10 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-stone-800">Recipes</h1>
        <Link href="/recipes/new" className="bg-amber-600 text-white rounded-full p-2 hover:bg-amber-700 transition-colors">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

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
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
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
          {filtered.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`}
              className="flex gap-4 bg-white rounded-2xl border border-stone-100 p-4 hover:border-stone-200 transition-colors">
              {r.cover_image_url
                ? <img src={r.cover_image_url} alt={r.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                : <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">🍲</div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-stone-800 text-sm leading-snug">{r.title}</p>
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
              <ChevronRight className="w-4 h-4 text-stone-300 shrink-0 self-center" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
