"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, ChevronLeft, Save } from "lucide-react";
import type { ExtractedRecipe } from "@/lib/claude";

function ConfidenceBadge({ confidence, needsReview }: { confidence: number; needsReview: boolean }) {
  if (needsReview) {
    return (
      <span className="flex items-center gap-1 text-amber-600 text-xs">
        <AlertTriangle className="w-3 h-3" />
        Review this
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-green-600 text-xs">
      <CheckCircle className="w-3 h-3" />
      {Math.round(confidence * 100)}% confident
    </span>
  );
}

function ReviewField({
  label,
  value,
  confidence,
  needsReview,
  onChange,
}: {
  label: string;
  value: string;
  confidence: number;
  needsReview: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className={`rounded-xl p-4 ${needsReview ? "bg-amber-50 border border-amber-200" : "bg-white border border-stone-100"}`}>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</label>
        <ConfidenceBadge confidence={confidence} needsReview={needsReview} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={value.split("\n").length + 1}
        className={`w-full text-sm text-stone-800 bg-transparent resize-none focus:outline-none font-mono
          ${needsReview ? "border-b border-amber-300" : "border-b border-transparent focus:border-stone-200"}`}
      />
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const [recipe, setRecipe] = useState<ExtractedRecipe | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Editable state
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [recipeYield, setRecipeYield] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("heirloom_recipe");
    const img = sessionStorage.getItem("heirloom_image");
    const mt = sessionStorage.getItem("heirloom_media_type");

    if (!raw) {
      router.replace("/upload");
      return;
    }

    const parsed: ExtractedRecipe = JSON.parse(raw);
    setRecipe(parsed);
    setImageBase64(img);
    setMediaType(mt);

    setTitle(parsed.title.value);
    setIngredients(Array.isArray(parsed.ingredients.value)
      ? parsed.ingredients.value.join("\n")
      : parsed.ingredients.value);
    setSteps(Array.isArray(parsed.steps.value)
      ? parsed.steps.value.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : parsed.steps.value);
    setRecipeYield(parsed.yield.value);
    setCookTime(parsed.cook_time.value);
    setNotes(parsed.notes.value);
  }, [router]);

  const reviewCount = recipe
    ? [recipe.title, recipe.ingredients, recipe.steps, recipe.yield, recipe.cook_time, recipe.notes]
        .filter((f) => f.needs_review).length
    : 0;

  const handleSave = () => {
    // Phase 1: save to localStorage (no backend yet)
    const saved_recipes = JSON.parse(localStorage.getItem("heirloom_recipes") || "[]");
    const newRecipe = {
      id: Date.now().toString(),
      title,
      ingredients: ingredients.split("\n").filter(Boolean),
      steps: steps.split("\n").filter(Boolean),
      yield: recipeYield,
      cook_time: cookTime,
      notes,
      image: imageBase64,
      media_type: mediaType,
      created_at: new Date().toISOString(),
    };
    saved_recipes.push(newRecipe);
    localStorage.setItem("heirloom_recipes", JSON.stringify(saved_recipes));
    setSaved(true);

    setTimeout(() => router.push("/archive"), 1200);
  };

  if (!recipe) return null;

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-stone-500 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-stone-800 font-serif text-lg">Review recipe</h1>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full transition-all
              ${saved ? "bg-green-100 text-green-700" : "bg-amber-600 text-white hover:bg-amber-700"}`}
          >
            {saved ? (
              <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save recipe</>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Review notice */}
        {reviewCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-800 text-sm font-medium">
                {reviewCount} field{reviewCount > 1 ? "s need" : " needs"} review
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Claude flagged these because the handwriting was unclear. Check the highlighted fields and correct anything wrong.
              </p>
            </div>
          </div>
        )}

        {/* Original image + raw transcription */}
        <details className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          <summary className="px-4 py-3 text-sm text-stone-500 cursor-pointer select-none hover:bg-stone-50">
            Original card + raw transcription
          </summary>
          <div className="px-4 pb-4 space-y-3">
            {imageBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:${mediaType};base64,${imageBase64}`}
                alt="Original recipe card"
                className="w-full rounded-lg object-contain max-h-64"
              />
            )}
            <p className="text-xs font-mono text-stone-500 whitespace-pre-wrap bg-stone-50 rounded p-3">
              {recipe.raw_transcription}
            </p>
          </div>
        </details>

        {/* Editable fields */}
        <ReviewField
          label="Recipe title"
          value={title}
          confidence={recipe.title.confidence}
          needsReview={recipe.title.needs_review}
          onChange={setTitle}
        />

        <ReviewField
          label="Ingredients (one per line)"
          value={ingredients}
          confidence={recipe.ingredients.confidence}
          needsReview={recipe.ingredients.needs_review}
          onChange={setIngredients}
        />

        <ReviewField
          label="Instructions"
          value={steps}
          confidence={recipe.steps.confidence}
          needsReview={recipe.steps.needs_review}
          onChange={setSteps}
        />

        <div className="grid grid-cols-2 gap-3">
          <ReviewField
            label="Yield"
            value={recipeYield}
            confidence={recipe.yield.confidence}
            needsReview={recipe.yield.needs_review}
            onChange={setRecipeYield}
          />
          <ReviewField
            label="Cook time"
            value={cookTime}
            confidence={recipe.cook_time.confidence}
            needsReview={recipe.cook_time.needs_review}
            onChange={setCookTime}
          />
        </div>

        <ReviewField
          label="Notes & family annotations"
          value={notes}
          confidence={recipe.notes.confidence}
          needsReview={recipe.notes.needs_review}
          onChange={setNotes}
        />

        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-4 rounded-xl font-medium text-sm transition-all mt-2
            ${saved ? "bg-green-100 text-green-700" : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"}`}
        >
          {saved ? "Saved. Taking you to your archive..." : "Save recipe"}
        </button>
      </div>
    </main>
  );
}
