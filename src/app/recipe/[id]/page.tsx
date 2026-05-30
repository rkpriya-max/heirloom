"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Clock, Users, Scroll } from "lucide-react";

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

export default function RecipePage() {
  const router = useRouter();
  const { id } = useParams();
  const [recipe, setRecipe] = useState<SavedRecipe | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    const saved: SavedRecipe[] = JSON.parse(localStorage.getItem("heirloom_recipes") || "[]");
    const found = saved.find((r) => r.id === id);
    if (found) setRecipe(found);
    else router.replace("/archive");
  }, [id, router]);

  if (!recipe) return null;

  const formattedDate = new Date(recipe.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="sticky top-0 bg-stone-50/90 backdrop-blur-sm z-10 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-stone-500 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Archive
          </button>
        </div>

        <div className="px-4 pb-12">
          {/* Original image */}
          {recipe.image && (
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${recipe.media_type};base64,${recipe.image}`}
                alt="Original recipe card"
                className="w-full rounded-2xl object-contain max-h-64 bg-stone-100"
              />
              <p className="text-center text-xs text-stone-400 mt-2">Original handwriting preserved</p>
            </div>
          )}

          {/* Title + meta */}
          <h1 className="text-2xl font-serif text-stone-800 mb-2">{recipe.title}</h1>
          <div className="flex items-center gap-4 text-stone-400 text-sm mb-6">
            {recipe.cook_time && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {recipe.cook_time}
              </span>
            )}
            {recipe.yield && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {recipe.yield}
              </span>
            )}
            <span className="ml-auto text-xs">Preserved {formattedDate}</span>
          </div>

          {/* Ingredients */}
          <section className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-stone-700 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </section>

          {/* Instructions */}
          <section className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Instructions</h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-stone-700">
                  <span className="font-serif text-amber-600 text-lg leading-snug shrink-0">{i + 1}</span>
                  <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Notes */}
          {recipe.notes && recipe.notes.trim() && (
            <section className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-4 mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-1.5">
                <Scroll className="w-3 h-3" />
                Family notes
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed italic">{recipe.notes}</p>
            </section>
          )}

          {/* Toggle original card view */}
          {recipe.image && (
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="w-full text-center text-stone-400 text-xs py-2 hover:text-stone-600 transition-colors"
            >
              {showOriginal ? "Hide" : "View"} original handwriting card
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
