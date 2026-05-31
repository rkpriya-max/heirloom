"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  notes: string | null;
  host_id: string;
}

interface MenuRecipe {
  recipe_id: string;
  sort_order: number;
  recipes: { id: string; title: string; yield: string | null; cook_time: string | null }[] | null;
}

interface MyRecipe { id: string; title: string; yield: string | null }
interface FamilyRecipe { id: string; title: string; yield: string | null; familyName: string }

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [menu, setMenu] = useState<MenuRecipe[]>([]);
  const [myRecipes, setMyRecipes] = useState<MyRecipe[]>([]);
  const [familyRecipes, setFamilyRecipes] = useState<FamilyRecipe[]>([]);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [
        { data: eventData },
        { data: menuData },
        { data: recipeData },
        { data: memberData },
      ] = await Promise.all([
        supabase.from("events").select("id, title, description, event_date, notes, host_id").eq("id", id).single(),
        supabase.from("event_recipes").select("recipe_id, sort_order, recipes(id, title, yield, cook_time)").eq("event_id", id).order("sort_order"),
        supabase.from("recipes").select("id, title, yield").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("family_members").select("family_id, families(id, name)").eq("user_id", user.id),
      ]);

      if (!eventData) { router.push("/events"); return; }

      const myRecipeList = (recipeData ?? []) as MyRecipe[];
      setEvent(eventData);
      setMenu((menuData ?? []) as MenuRecipe[]);
      setMyRecipes(myRecipeList);

      // Build family recipes from all families the user belongs to
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const familyMap: Record<string, string> = {};
      const familyIds: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (memberData ?? []).forEach((row: any) => {
        const fam = Array.isArray(row.families) ? row.families[0] : row.families;
        if (fam?.id) { familyMap[fam.id] = fam.name; familyIds.push(fam.id); }
      });

      if (familyIds.length > 0) {
        const { data: frData } = await supabase
          .from("family_recipes")
          .select("recipe_id, family_id, recipes(id, title, yield)")
          .in("family_id", familyIds);

        const myIds = new Set(myRecipeList.map((r) => r.id));
        const seen = new Set<string>();
        const fRecipes: FamilyRecipe[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (frData ?? []).forEach((fr: any) => {
          const r = Array.isArray(fr.recipes) ? fr.recipes[0] : fr.recipes;
          if (!r || myIds.has(r.id) || seen.has(r.id)) return;
          seen.add(r.id);
          fRecipes.push({ id: r.id, title: r.title, yield: r.yield ?? null, familyName: familyMap[fr.family_id] ?? "Family" });
        });
        setFamilyRecipes(fRecipes);
      }

      setLoading(false);
    };
    load();
  }, [id, router]);

  const menuIds = new Set(menu.map((m) => m.recipe_id));
  const availableOwn = myRecipes.filter((r) => !menuIds.has(r.id));
  const availableFamily = familyRecipes.filter((r) => !menuIds.has(r.id));

  const handleAddToMenu = async (recipeId: string, title: string, yieldStr: string | null) => {
    setAdding(recipeId);
    const supabase = createClient();
    const { error } = await supabase.from("event_recipes").insert({
      event_id: id,
      recipe_id: recipeId,
      sort_order: menu.length,
    });
    if (!error) {
      setMenu((prev) => [...prev, {
        recipe_id: recipeId,
        sort_order: prev.length,
        recipes: [{ id: recipeId, title, yield: yieldStr, cook_time: null }],
      }]);
      setShowAddRecipe(false);
    }
    setAdding(null);
  };

  const handleRemoveFromMenu = async (recipeId: string) => {
    setRemoving(recipeId);
    const supabase = createClient();
    await supabase.from("event_recipes").delete().eq("event_id", id).eq("recipe_id", recipeId);
    setMenu((prev) => prev.filter((m) => m.recipe_id !== recipeId));
    setRemoving(null);
  };

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="h-32 bg-stone-200 rounded-2xl" />
          <div className="h-24 bg-stone-200 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!event) return null;

  const menuRecipes = menu.map((m) => ({
    recipeId: m.recipe_id,
    recipe: (Array.isArray(m.recipes) ? m.recipes[0] : m.recipes) ?? null,
  }));

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-stone-400">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-stone-800">Event</h1>
        <div className="w-8" />
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Event card */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-xl font-serif text-stone-800 flex-1 pr-2">{event.title}</h2>
            <span className="text-2xl">🎉</span>
          </div>
          <p className="text-amber-600 text-sm font-medium mb-2">{formatDate(event.event_date)}</p>
          {event.description && <p className="text-stone-500 text-sm">{event.description}</p>}
          {event.notes && <p className="text-stone-400 text-xs mt-2 italic">{event.notes}</p>}
        </div>

        {/* Menu */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Menu ({menuRecipes.length} recipe{menuRecipes.length !== 1 ? "s" : ""})
            </h2>
            <button onClick={() => setShowAddRecipe(true)}
              className="flex items-center gap-1 text-xs text-amber-600 font-medium">
              <Plus className="w-3 h-3" /> Add recipe
            </button>
          </div>

          {menuRecipes.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm">
              No recipes in the menu yet.{" "}
              <button onClick={() => setShowAddRecipe(true)} className="text-amber-600">Add some →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {menuRecipes.map(({ recipeId, recipe }) => recipe && (
                <div key={recipeId}
                  className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg shrink-0">🍲</div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/recipes/${recipe.id}`}
                      className="font-medium text-stone-800 text-sm hover:text-amber-700">{recipe.title}</Link>
                    {(recipe.yield || recipe.cook_time) && (
                      <p className="text-xs text-stone-400">
                        {[recipe.yield, recipe.cook_time].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {removing === recipeId
                    ? <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
                    : (
                      <button onClick={() => handleRemoveFromMenu(recipeId)}
                        className="text-stone-200 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Summary */}
        {menuRecipes.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">Menu summary</p>
            <ul className="space-y-1">
              {menuRecipes.map(({ recipeId, recipe }) => recipe && (
                <li key={recipeId} className="text-xs text-stone-600 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                  {recipe.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add recipe modal */}
      {showAddRecipe && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowAddRecipe(false)}>
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6 max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-stone-800 text-lg mb-4 shrink-0">Add to menu</h2>
            <div className="overflow-y-auto flex-1 space-y-4">

              {/* My recipes */}
              {availableOwn.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">My recipes</p>
                  <div className="space-y-2">
                    {availableOwn.map((r) => (
                      <button key={r.id}
                        onClick={() => handleAddToMenu(r.id, r.title, r.yield)}
                        disabled={adding === r.id}
                        className="w-full flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 hover:bg-amber-50 transition-colors text-left disabled:opacity-50">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg shrink-0">🍲</div>
                        <div className="flex-1">
                          <p className="font-medium text-stone-800 text-sm">{r.title}</p>
                          {r.yield && <p className="text-xs text-stone-400">{r.yield}</p>}
                        </div>
                        {adding === r.id && <Loader2 className="w-4 h-4 animate-spin text-stone-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Family recipes grouped by family */}
              {availableFamily.length > 0 && (
                <div>
                  {Array.from(new Set(availableFamily.map((r) => r.familyName))).map((fName) => (
                    <div key={fName} className="mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-2">
                        🏠 {fName}
                      </p>
                      <div className="space-y-2">
                        {availableFamily.filter((r) => r.familyName === fName).map((r) => (
                          <button key={r.id}
                            onClick={() => handleAddToMenu(r.id, r.title, r.yield)}
                            disabled={adding === r.id}
                            className="w-full flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 hover:bg-amber-50 transition-colors text-left disabled:opacity-50">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0">🍲</div>
                            <div className="flex-1">
                              <p className="font-medium text-stone-800 text-sm">{r.title}</p>
                              {r.yield && <p className="text-xs text-stone-400">{r.yield}</p>}
                            </div>
                            {adding === r.id && <Loader2 className="w-4 h-4 animate-spin text-stone-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableOwn.length === 0 && availableFamily.length === 0 && (
                <div className="text-center py-8 text-stone-400 text-sm">
                  <p className="mb-1">All recipes are already in this menu.</p>
                  <Link href="/upload" className="text-amber-600 text-sm">Add a new recipe →</Link>
                </div>
              )}
            </div>
            <button onClick={() => setShowAddRecipe(false)} className="mt-4 text-stone-400 text-sm shrink-0 text-center w-full">
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
