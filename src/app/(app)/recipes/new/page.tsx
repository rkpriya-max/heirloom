"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, PenLine, Plus, Minus } from "lucide-react";

type Mode = "scan" | "type";

export default function NewRecipePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scan");
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  const addIngredient = () => setIngredients((p) => [...p, ""]);
  const updateIngredient = (i: number, v: string) => setIngredients((p) => p.map((x, idx) => idx === i ? v : x));
  const removeIngredient = (i: number) => setIngredients((p) => p.filter((_, idx) => idx !== i));

  const addStep = () => setSteps((p) => [...p, ""]);
  const updateStep = (i: number, v: string) => setSteps((p) => p.map((x, idx) => idx === i ? v : x));

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
            <ChevronLeft className="w-4 h-4" /> Cancel
          </button>
          <h1 className="font-serif text-stone-800">New recipe</h1>
          <button
            onClick={() => router.push("/recipes/r1")}
            className="text-sm text-amber-600 font-medium"
          >
            Save
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-stone-100 rounded-xl p-1">
          <button
            onClick={() => setMode("scan")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
              ${mode === "scan" ? "bg-white shadow-sm text-stone-800" : "text-stone-400"}`}
          >
            <Camera className="w-4 h-4" /> Scan card
          </button>
          <button
            onClick={() => setMode("type")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all
              ${mode === "type" ? "bg-white shadow-sm text-stone-800" : "text-stone-400"}`}
          >
            <PenLine className="w-4 h-4" /> Type it in
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {mode === "scan" ? (
          <div className="space-y-4">
            {/* Scan zone */}
            <div
              onClick={() => router.push("/upload")}
              className="border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center py-16 cursor-pointer hover:border-amber-400 transition-colors"
            >
              <div className="bg-stone-100 rounded-full p-4 mb-4">
                <Camera className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-stone-600 font-medium mb-1">Photograph a recipe card</p>
              <p className="text-stone-400 text-sm">Camera or photo library</p>
            </div>

            <div className="text-center">
              <p className="text-stone-400 text-xs">Claude reads the handwriting and structures it automatically.</p>
              <p className="text-stone-400 text-xs mt-0.5">You review and confirm before saving.</p>
            </div>

            <div className="border-t border-stone-100 pt-4 text-center">
              <button onClick={() => setMode("type")} className="text-amber-600 text-sm">
                Or type the recipe manually →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Recipe title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Amma's Sambar Podi"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Tags</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tamil, Amma, Spice blend..."
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Ingredients */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Ingredients</label>
              <div className="space-y-2">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={ing}
                      onChange={(e) => updateIngredient(i, e.target.value)}
                      placeholder={`Ingredient ${i + 1}`}
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:border-amber-400"
                    />
                    {ingredients.length > 1 && (
                      <button onClick={() => removeIngredient(i)} className="text-stone-300 hover:text-red-400 transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addIngredient} className="flex items-center gap-1.5 text-amber-600 text-sm mt-1">
                  <Plus className="w-4 h-4" /> Add ingredient
                </button>
              </div>
            </div>

            {/* Steps */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Instructions</label>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="font-serif text-amber-600 text-lg w-5 shrink-0 mt-2">{i + 1}</span>
                    <textarea
                      value={step}
                      onChange={(e) => updateStep(i, e.target.value)}
                      placeholder={`Step ${i + 1}`}
                      rows={2}
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>
                ))}
                <button onClick={addStep} className="flex items-center gap-1.5 text-amber-600 text-sm mt-1 ml-7">
                  <Plus className="w-4 h-4" /> Add step
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Family notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Stories, tips, what makes this recipe special..."
                rows={3}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <button
              onClick={() => router.push("/recipes/r1")}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors"
            >
              Save recipe
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
