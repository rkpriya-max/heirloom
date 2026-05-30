"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, PenLine, Plus, Minus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

type Mode = "scan" | "type";

export default function NewRecipePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scan");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addIngredient = () => setIngredients((p) => [...p, ""]);
  const updateIngredient = (i: number, v: string) => setIngredients((p) => p.map((x, idx) => idx === i ? v : x));
  const removeIngredient = (i: number) => setIngredients((p) => p.filter((_, idx) => idx !== i));
  const addStep = () => setSteps((p) => [...p, ""]);
  const updateStep = (i: number, v: string) => setSteps((p) => p.map((x, idx) => idx === i ? v : x));

  const handleSave = async () => {
    if (!title.trim()) { setError("Recipe title is required."); return; }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({ user_id: user.id, title: title.trim(), description: description.trim() || null, notes: notes.trim() || null })
      .select("id")
      .single();

    if (recipeError || !recipe) { setError("Failed to save. Try again."); setSaving(false); return; }

    const id = recipe.id;

    const ops = [];

    const filteredIngredients = ingredients.filter((i) => i.trim());
    if (filteredIngredients.length > 0) {
      ops.push(supabase.from("recipe_ingredients").insert({
        recipe_id: id,
        section: null,
        items: filteredIngredients,
        sort_order: 0,
      }));
    }

    const filteredSteps = steps.filter((s) => s.trim());
    if (filteredSteps.length > 0) {
      ops.push(...filteredSteps.map((content, i) =>
        supabase.from("recipe_steps").insert({ recipe_id: id, content, sort_order: i })
      ));
    }

    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      ops.push(supabase.from("recipe_tags").insert(tagList.map((tag) => ({ recipe_id: id, tag }))));
    }

    await Promise.all(ops);
    router.push(`/recipes/${id}`);
  };

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
            <ChevronLeft className="w-4 h-4" /> Cancel
          </button>
          <h1 className="font-serif text-stone-800">New recipe</h1>
          <button onClick={handleSave} disabled={saving} className="text-sm text-amber-600 font-medium disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </button>
        </div>
        <div className="flex bg-stone-100 rounded-xl p-1">
          <button onClick={() => setMode("scan")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
              ${mode === "scan" ? "bg-white shadow-sm text-stone-800" : "text-stone-400"}`}>
            <Camera className="w-4 h-4" /> Scan card
          </button>
          <button onClick={() => setMode("type")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
              ${mode === "type" ? "bg-white shadow-sm text-stone-800" : "text-stone-400"}`}>
            <PenLine className="w-4 h-4" /> Type it in
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {mode === "scan" ? (
          <div className="space-y-4">
            <div onClick={() => router.push("/upload")}
              className="border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center py-16 cursor-pointer hover:border-amber-400 transition-colors">
              <div className="bg-stone-100 rounded-full p-4 mb-4">
                <Camera className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-stone-600 font-medium mb-1">Photograph a recipe card</p>
              <p className="text-stone-400 text-sm">Camera or photo library</p>
            </div>
            <p className="text-center text-stone-400 text-xs">Claude reads the handwriting and structures it automatically.</p>
            <div className="border-t border-stone-100 pt-4 text-center">
              <button onClick={() => setMode("type")} className="text-amber-600 text-sm">Or type the recipe manually →</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Recipe title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Amma's Sambar Podi"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400" />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this recipe special?"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400" />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Tags</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tamil, Amma, Spice blend (comma separated)"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400" />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Ingredients</label>
              <div className="space-y-2">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={ing} onChange={(e) => updateIngredient(i, e.target.value)} placeholder={`Ingredient ${i + 1}`}
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:border-amber-400" />
                    {ingredients.length > 1 && (
                      <button onClick={() => removeIngredient(i)} className="text-stone-300 hover:text-red-400 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addIngredient} className="flex items-center gap-1.5 text-amber-600 text-sm">
                  <Plus className="w-4 h-4" /> Add ingredient
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Instructions</label>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="font-serif text-amber-600 text-lg w-5 shrink-0 mt-2">{i + 1}</span>
                    <textarea value={step} onChange={(e) => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}`} rows={2}
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:border-amber-400 resize-none" />
                  </div>
                ))}
                <button onClick={addStep} className="flex items-center gap-1.5 text-amber-600 text-sm ml-7">
                  <Plus className="w-4 h-4" /> Add step
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Family notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Stories, tips, what makes this recipe special..." rows={3}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400 resize-none" />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button onClick={handleSave} disabled={saving}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save recipe"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
