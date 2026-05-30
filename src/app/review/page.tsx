"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, ChevronLeft, Save, Layers } from "lucide-react";
import type { ExtractedRecipe, IngredientSection } from "@/lib/claude";

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
      {Math.round(confidence * 100)}%
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
        rows={Math.max(2, value.split("\n").length + 1)}
        className={`w-full text-sm text-stone-800 bg-transparent resize-none focus:outline-none font-mono
          ${needsReview ? "border-b border-amber-300" : "border-b border-transparent focus:border-stone-200"}`}
      />
    </div>
  );
}

interface EditableRecipe {
  title: string;
  ingredients: string;
  steps: string;
  yield: string;
  cook_time: string;
  notes: string;
}

function ingredientsToText(sections: IngredientSection[]): string {
  if (!sections || sections.length === 0) return "";
  // If single section with no header, just list items
  if (sections.length === 1 && !sections[0].section) {
    return sections[0].items.join("\n");
  }
  // Multiple sections or named sections — use headers
  return sections
    .map((s) => (s.section ? `## ${s.section}\n${s.items.join("\n")}` : s.items.join("\n")))
    .join("\n\n");
}

function initEditable(recipe: ExtractedRecipe): EditableRecipe {
  return {
    title: recipe.title.value,
    ingredients: ingredientsToText(recipe.ingredients.value),
    steps: Array.isArray(recipe.steps.value)
      ? recipe.steps.value.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : recipe.steps.value,
    yield: recipe.yield.value,
    cook_time: recipe.cook_time.value,
    notes: recipe.notes.value,
  };
}

export default function ReviewPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<ExtractedRecipe[]>([]);
  const [editables, setEditables] = useState<EditableRecipe[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("heirloom_recipes");
    const img = sessionStorage.getItem("heirloom_image");
    const mt = sessionStorage.getItem("heirloom_media_type");

    if (!raw) { router.replace("/upload"); return; }

    const parsed: ExtractedRecipe[] = JSON.parse(raw);
    setRecipes(parsed);
    setEditables(parsed.map(initEditable));
    setImageBase64(img);
    setMediaType(mt);
  }, [router]);

  const updateField = (recipeIdx: number, field: keyof EditableRecipe, value: string) => {
    setEditables((prev) => prev.map((e, i) => i === recipeIdx ? { ...e, [field]: value } : e));
  };

  const handleSave = () => {
    const existing = JSON.parse(localStorage.getItem("heirloom_recipes") || "[]");
    const newEntries = editables.map((e) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: e.title,
      ingredients: e.ingredients.split("\n").filter(Boolean),
      steps: e.steps.split("\n").filter(Boolean),
      yield: e.yield,
      cook_time: e.cook_time,
      notes: e.notes,
      image: imageBase64,
      media_type: mediaType,
      created_at: new Date().toISOString(),
    }));
    localStorage.setItem("heirloom_recipes", JSON.stringify([...existing, ...newEntries]));
    setSaved(true);
    setTimeout(() => router.push("/archive"), 1200);
  };

  if (recipes.length === 0) return null;

  const multi = recipes.length > 1;
  const active = recipes[activeTab];
  const edit = editables[activeTab];
  const reviewCount = active
    ? [active.title, active.ingredients, active.steps, active.yield, active.cook_time, active.notes].filter((f) => f.needs_review).length
    : 0;

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-stone-800 font-serif text-lg">Review</h1>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full transition-all
              ${saved ? "bg-green-100 text-green-700" : "bg-amber-600 text-white hover:bg-amber-700"}`}
          >
            {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</> : <><Save className="w-3.5 h-3.5" /> Save {multi ? "all" : ""}</>}
          </button>
        </div>

        {/* Multi-recipe tabs */}
        {multi && (
          <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
            {recipes.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${activeTab === i ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
              >
                {editables[i]?.title || `Recipe ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Multi-recipe notice */}
        {multi && (
          <div className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Layers className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
            <p className="text-stone-600 text-sm">
              Found <strong>{recipes.length} recipes</strong> on this card. Each will be saved as a separate entry. Switch between them using the tabs above.
            </p>
          </div>
        )}

        {/* Review flag notice */}
        {reviewCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-800 text-sm font-medium">
                {reviewCount} field{reviewCount > 1 ? "s need" : " needs"} review
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Highlighted fields were unclear. Check and correct anything wrong.
              </p>
            </div>
          </div>
        )}

        {/* Original image */}
        <details className="bg-white border border-stone-100 rounded-xl overflow-hidden">
          <summary className="px-4 py-3 text-sm text-stone-500 cursor-pointer select-none hover:bg-stone-50">
            Original card
          </summary>
          <div className="px-4 pb-4 space-y-3">
            {imageBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:${mediaType};base64,${imageBase64}`} alt="Original" className="w-full rounded-lg object-contain max-h-64" />
            )}
            <p className="text-xs font-mono text-stone-500 whitespace-pre-wrap bg-stone-50 rounded p-3">
              {active?.raw_transcription}
            </p>
          </div>
        </details>

        {/* Editable fields */}
        {edit && (
          <>
            <ReviewField label="Recipe title" value={edit.title} confidence={active.title.confidence} needsReview={active.title.needs_review} onChange={(v) => updateField(activeTab, "title", v)} />
            <ReviewField label="Ingredients (one per line, ## for sections)" value={edit.ingredients} confidence={active.ingredients.confidence} needsReview={active.ingredients.needs_review} onChange={(v) => updateField(activeTab, "ingredients", v)} />
            <ReviewField label="Instructions" value={edit.steps} confidence={active.steps.confidence} needsReview={active.steps.needs_review} onChange={(v) => updateField(activeTab, "steps", v)} />
            <div className="grid grid-cols-2 gap-3">
              <ReviewField label="Yield" value={edit.yield} confidence={active.yield.confidence} needsReview={active.yield.needs_review} onChange={(v) => updateField(activeTab, "yield", v)} />
              <ReviewField label="Cook time" value={edit.cook_time} confidence={active.cook_time.confidence} needsReview={active.cook_time.needs_review} onChange={(v) => updateField(activeTab, "cook_time", v)} />
            </div>
            <ReviewField label="Notes & family annotations" value={edit.notes} confidence={active.notes.confidence} needsReview={active.notes.needs_review} onChange={(v) => updateField(activeTab, "notes", v)} />
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-4 rounded-xl font-medium text-sm transition-all
            ${saved ? "bg-green-100 text-green-700" : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"}`}
        >
          {saved
            ? "Saved. Taking you to your archive..."
            : multi
            ? `Save all ${recipes.length} recipes`
            : "Save recipe"}
        </button>
      </div>
    </main>
  );
}
