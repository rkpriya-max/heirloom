"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Globe, Lock } from "lucide-react";
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
      <main className="max-w-lg mx-auto px-5 pt-14">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-stone-200 rounded w-40" />
          <div className="h-11 bg-stone-200 rounded-xl" />
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-stone-200 rounded-2xl" />)}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-5 pt-14 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--ink-faint)' }}>
            From memory to legacy
          </p>
          <h1 className="font-serif text-3xl font-semibold mt-1" style={{ color: 'var(--ink)' }}>
            The Collection
          </h1>
        </div>
        <Link
          href="/recipes/new"
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--red)', boxShadow: '0 8px 18px -8px rgba(122,27,26,0.8)' }}
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.2} />
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-3.5">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--ink-faint)' }}
          strokeWidth={2}
        />
        <input
          type="text"
          placeholder="Search recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = 'var(--mustard-soft)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--line)')}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
        />
      </div>

      {/* Filter chips */}
      {filters.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={filter === f
                ? { background: 'var(--red)', color: '#FFFDF8' }
                : { background: 'var(--surface)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }
              }
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          {recipes.length === 0 ? (
            <>
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold mb-1" style={{ color: 'var(--ink-soft)' }}>No recipes yet</p>
              <p className="text-sm mb-5" style={{ color: 'var(--ink-faint)' }}>Scan a handwritten card or type one in.</p>
              <Link href="/recipes/new" className="text-sm font-bold" style={{ color: 'var(--red)' }}>
                Add your first recipe →
              </Link>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>No recipes match your search.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/recipes/${r.id}`}
              className="flex overflow-hidden rounded-2xl transition-opacity hover:opacity-90"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                boxShadow: '0 1px 0 rgba(42,28,21,0.04), 0 6px 20px -12px rgba(42,28,21,0.2)',
              }}
            >
              {/* Cover band — full card height, no padding */}
              {r.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.cover_image_url}
                  alt={r.title}
                  className="w-20 flex-none object-cover self-stretch"
                />
              ) : (
                <div
                  className="w-20 flex-none flex items-center justify-center text-3xl"
                  style={{ background: 'linear-gradient(135deg, #F6DEB8, #EECB8A)' }}
                >
                  🍲
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0 px-4 py-3.5">
                <div className="flex items-start gap-2">
                  <p
                    className="font-serif font-semibold leading-snug flex-1"
                    style={{ fontSize: 18, color: 'var(--ink)' }}
                  >
                    {r.title}
                  </p>
                  {r.is_public
                    ? <Globe className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: 'var(--ink-faint)' }} strokeWidth={1.8} />
                    : <Lock className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: 'var(--ink-faint)' }} strokeWidth={1.8} />
                  }
                </div>
                {r.description && (
                  <p className="text-[12.5px] mt-1 line-clamp-1" style={{ color: 'var(--ink-faint)' }}>
                    {r.description}
                  </p>
                )}
                {r.recipe_tags.length > 0 && (
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    {r.recipe_tags.slice(0, 2).map(({ tag }) => (
                      <span
                        key={tag}
                        className="text-[10.5px] font-bold rounded-full px-2 py-0.5"
                        style={{ background: 'var(--mustard-wash)', color: 'var(--red-deep)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
