"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, ChevronLeft, Save, Layers, Loader2 } from "lucide-react";
import type { ExtractedRecipe } from "@/lib/claude";
import { createClient } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

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
  label, value, confidence, needsReview, onChange,
}: {
  label: string; value: string; confidence: number; needsReview: boolean; onChange: (v: string) => void;
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

interface IngredientSection { section?: string; items: string[] }

function ingredientsToText(sections: IngredientSection[]): string {
  if (!sections || !Array.isArray(sections) || sections.length === 0) return "";
  const safeItems = (items: unknown) =>
    Array.isArray(items) ? items.map(String).join("\n") : String(items ?? "");
  if (sections.length === 1 && !sections[0].section) return safeItems(sections[0].items);
  return sections
    .map((s) => (s.section ? `## ${s.section}\n${safeItems(s.items)}` : safeItems(s.items)))
    .join("\n\n");
}

function textToIngredients(text: string): IngredientSection[] {
  if (!text.trim()) return [];
  const sections: IngredientSection[] = [];
  let current: IngredientSection = { items: [] };
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("##")) {
      if (current.items.length > 0 || current.section) sections.push(current);
      current = { section: trimmed.replace(/^##\s*/, ""), items: [] };
    } else {
      current.items.push(trimmed);
    }
  }
  if (current.items.length > 0) sections.push(current);
  return sections;
}

function textToSteps(text: string): string[] {
  if (!text.trim()) return [];
  return text.split("\n").map((l) => l.trim().replace(/^\d+\.\s*/, "")).filter(Boolean);
}

function safeStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function initEditable(recipe: ExtractedRecipe): EditableRecipe {
  try {
    const stepsVal = recipe.steps?.value;
    const stepsText = Array.isArray(stepsVal)
      ? stepsVal.map((s, i) => `${i + 1}. ${safeStr(s)}`).join("\n")
      : safeStr(stepsVal);

    const ingredientsVal = recipe.ingredients?.value;
    const ingredientsText = Array.isArray(ingredientsVal)
      ? ingredientsToText(ingredientsVal)
      : safeStr(ingredientsVal);

    return {
      title: safeStr(recipe.title?.value),
      ingredients: ingredientsText,
      steps: stepsText,
      yield: safeStr(recipe.yield?.value),
      cook_time: safeStr(recipe.cook_time?.value),
      notes: safeStr(recipe.notes?.value),
    };
  } catch {
    return { title: "", ingredients: "", steps: "", yield: "", cook_time: "", notes: "" };
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mimeType });
}

export default function ReviewPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<ExtractedRecipe[]>([]);
  const [editables, setEditables] = useState<EditableRecipe[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [voiceAudioBase64, setVoiceAudioBase64] = useState<string | null>(null);
  const [voiceAudioType, setVoiceAudioType] = useState<string | null>(null);
  const [voiceRecordedBy, setVoiceRecordedBy] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("heirloom_recipes");
      const img = sessionStorage.getItem("heirloom_image");
      const mt = sessionStorage.getItem("heirloom_media_type");
      const voiceAudio = sessionStorage.getItem("heirloom_voice_audio");
      const voiceType = sessionStorage.getItem("heirloom_voice_type");
      if (!raw) { router.replace("/upload"); return; }
      const parsed: ExtractedRecipe[] = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (list.length === 0) { router.replace("/upload"); return; }
      setRecipes(list);
      setEditables(list.map(initEditable));
      setImageBase64(img);
      setMediaType(mt);
      setVoiceAudioBase64(voiceAudio);
      setVoiceAudioType(voiceType);
      setChecking(false);
    } catch (e) {
      console.error("Review page parse error:", e);
      router.replace("/upload");
    }
  }, [router]);

  const updateField = (idx: number, field: keyof EditableRecipe, value: string) =>
    setEditables((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const savedIds: string[] = [];

    for (const e of editables) {
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title: e.title.trim() || "Untitled recipe",
          yield: e.yield.trim() || null,
          cook_time: e.cook_time.trim() || null,
          notes: e.notes.trim() || null,
        })
        .select("id")
        .single();

      if (recipeError || !recipe) {
        setError(`Save failed: ${recipeError?.message ?? "no recipe returned"}`);
        setSaving(false);
        return;
      }

      const recipeId = recipe.id;
      savedIds.push(recipeId);

      const ops = [];

      const ingredientGroups = textToIngredients(e.ingredients);
      if (ingredientGroups.length > 0) {
        ops.push(...ingredientGroups.map((group, i) =>
          supabase.from("recipe_ingredients").insert({
            recipe_id: recipeId,
            section: group.section || null,
            items: group.items,
            sort_order: i,
          })
        ));
      }

      const parsedSteps = textToSteps(e.steps);
      if (parsedSteps.length > 0) {
        ops.push(...parsedSteps.map((content, i) =>
          supabase.from("recipe_steps").insert({ recipe_id: recipeId, content, sort_order: i })
        ));
      }

      await Promise.all(ops);

      // Upload original scan image to storage
      if (imageBase64 && mediaType) {
        const ext = mediaType.includes("png") ? "png" : "jpg";
        const blob = base64ToBlob(imageBase64, mediaType);
        const { data: imgUpload } = await supabase.storage
          .from("recipe-media")
          .upload(`recipes/${recipeId}/original.${ext}`, blob, { upsert: true });
        if (imgUpload) {
          const { data: urlData } = supabase.storage.from("recipe-media").getPublicUrl(imgUpload.path);
          await supabase.from("recipes").update({ original_image_url: urlData.publicUrl }).eq("id", recipeId);
        }
      }

      // Upload voice recording to storage
      if (voiceAudioBase64 && voiceAudioType) {
        const ext = voiceAudioType.includes("ogg") ? "ogg" : "webm";
        const blob = base64ToBlob(voiceAudioBase64, voiceAudioType);
        const { data: audioUpload } = await supabase.storage
          .from("recipe-media")
          .upload(`recipes/${recipeId}/voice.${ext}`, blob, { upsert: true });
        if (audioUpload) {
          const { data: urlData } = supabase.storage.from("recipe-media").getPublicUrl(audioUpload.path);
          await supabase.from("recipes").update({
            voice_recording_url: urlData.publicUrl,
            voice_recorded_by: voiceRecordedBy.trim() || null,
          }).eq("id", recipeId);
        }
      }
    }

    // Clear sessionStorage
    sessionStorage.removeItem("heirloom_recipes");
    sessionStorage.removeItem("heirloom_image");
    sessionStorage.removeItem("heirloom_media_type");
    sessionStorage.removeItem("heirloom_voice_audio");
    sessionStorage.removeItem("heirloom_voice_type");

    setSaved(true);
    if (savedIds.length === 1) {
      setTimeout(() => router.push(`/recipes/${savedIds[0]}`), 1000);
    } else {
      setTimeout(() => router.push("/recipes"), 1000);
    }
  };

  if (checking || recipes.length === 0) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
      </main>
    );
  }

  const multi = recipes.length > 1;
  const active = recipes[activeTab];
  const edit = editables[activeTab];
  const reviewCount = active
    ? [active.title, active.ingredients, active.steps, active.yield, active.cook_time, active.notes].filter((f) => f.needs_review).length
    : 0;

  return (
    <><main className="min-h-screen bg-stone-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/home" className="flex items-center gap-1 text-stone-500 text-sm hover:text-stone-700">
            <ChevronLeft className="w-4 h-4" /> Home
          </a>
          <h1 className="text-stone-800 font-serif text-lg">Review</h1>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full transition-all
              ${saved ? "bg-green-100 text-green-700" : "bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"}`}
          >
            {saved
              ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
              : saving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
              : <><Save className="w-3.5 h-3.5" /> Save {multi ? "all" : ""}</>}
          </button>
        </div>

        {multi && (
          <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
            {recipes.map((_, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${activeTab === i ? "bg-amber-600 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}>
                {editables[i]?.title || `Recipe ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {multi && (
          <div className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Layers className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
            <p className="text-stone-600 text-sm">
              Found <strong>{recipes.length} recipes</strong> on this card. Each will be saved as a separate entry.
            </p>
          </div>
        )}

        {reviewCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-800 text-sm font-medium">
                {reviewCount} field{reviewCount > 1 ? "s need" : " needs"} review
              </p>
              <p className="text-amber-600 text-xs mt-0.5">
                Highlighted in amber — check and correct anything that looks wrong.
              </p>
            </div>
          </div>
        )}

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

        {/* Voice attribution — only shown when a recording was captured */}
        {voiceAudioBase64 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2 block">🎙️ Voice recording saved</label>
            <input
              value={voiceRecordedBy}
              onChange={(e) => setVoiceRecordedBy(e.target.value)}
              placeholder="Who recorded this? e.g. Amma, May 2026"
              className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full py-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2
            ${saved ? "bg-green-100 text-green-700" : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm disabled:opacity-50"}`}
        >
          {saved
            ? "Saved — taking you to your recipe..."
            : saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving to your collection...</>
            : multi
            ? `Save all ${recipes.length} recipes`
            : "Save recipe"}
        </button>
      </div>
    </main><BottomNav /></>
  );
}
