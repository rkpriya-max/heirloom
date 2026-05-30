"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock, Users } from "lucide-react";

interface SavedRecipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  yield: string;
  cook_time: string;
  notes: string;
  image: string | null;
  media_type: string | null;
  created_at: string;
}

export default function ArchivePage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("heirloom_recipes") || "[]");
    setRecipes(saved.reverse()); // newest first
  }, []);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif text-stone-800">Your archive</h1>
            <p className="text-stone-400 text-sm mt-0.5">
              {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} preserved
            </p>
          </div>
          <button
            onClick={() => router.push("/upload")}
            className="flex items-center gap-1.5 bg-amber-600 text-white text-sm px-4 py-2.5 rounded-xl hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add recipe
          </button>
        </div>

        {/* Empty state */}
        {recipes.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-stone-600 font-medium mb-2">No recipes yet</p>
            <p className="text-stone-400 text-sm mb-6">
              Photograph a handwritten recipe card to get started.
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-amber-600 text-white text-sm px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
            >
              Digitize your first recipe
            </button>
          </div>
        )}

        {/* Recipe grid */}
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-stone-200 transition-colors cursor-pointer"
              onClick={() => router.push(`/recipe/${recipe.id}`)}
            >
              <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  {recipe.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:${recipe.media_type};base64,${recipe.image}`}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📝</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-stone-800 truncate">{recipe.title || "Untitled recipe"}</h2>
                  <p className="text-stone-400 text-xs mt-0.5 truncate">
                    {recipe.ingredients.slice(0, 3).join(", ")}
                    {recipe.ingredients.length > 3 ? ` +${recipe.ingredients.length - 3} more` : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    {recipe.cook_time && (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Clock className="w-3 h-3" />
                        {recipe.cook_time}
                      </span>
                    )}
                    {recipe.yield && (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Users className="w-3 h-3" />
                        {recipe.yield}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade prompt at 25 recipes */}
        {recipes.length >= 20 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <p className="font-medium text-amber-800 mb-1">
              {25 - recipes.length} recipe{25 - recipes.length !== 1 ? "s" : ""} left on free plan
            </p>
            <p className="text-amber-600 text-sm mb-4">
              Upgrade to Heirloom for unlimited digitization, family sharing, and a printed cookbook.
            </p>
            <button className="bg-amber-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-amber-700 transition-colors">
              Upgrade to Heirloom — $99/year
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
