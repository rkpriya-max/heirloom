"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Clock, Users, Globe, Lock, Send,
  Plus, Tag, MessageCircle, BookHeart, Loader2, Pencil, Check, X
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Toast, useToast } from "@/components/Toast";

type Tab = "recipe" | "memories";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  cook_time: string | null;
  yield: string | null;
  is_public: boolean;
  user_id: string;
  original_image_url: string | null;
  voice_recording_url: string | null;
  voice_recorded_by: string | null;
  cover_image_url: string | null;
}

interface IngredientGroup {
  id: string;
  section: string | null;
  items: string[];
  sort_order: number;
}

interface Step { id: string; content: string; sort_order: number }

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

interface Memory {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  tagged_people: string[];
}

interface Version {
  id: string;
  label: string;
  notes: string | null;
  created_at: string;
  author_id: string | null;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<IngredientGroup[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  const [tab, setTab] = useState<Tab>("recipe");
  const [newMemory, setNewMemory] = useState("");
  const [newComment, setNewComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { toast, show: showToast, clear: clearToast } = useToast();

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editIngredients, setEditIngredients] = useState("");
  const [editSteps, setEditSteps] = useState("");
  const [editCookTime, setEditCookTime] = useState("");
  const [editYield, setEditYield] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const handleCoverUpload = async (file: File, inputEl?: HTMLInputElement) => {
    if (!recipe) return;
    setUploadingCover(true);
    // Reset input immediately so the same file can be re-selected next time
    if (inputEl) inputEl.value = "";
    const supabase = createClient();

    // Compress
    const compressed = await new Promise<File>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob ? new File([blob], "cover.jpg", { type: "image/jpeg" }) : file), "image/jpeg", 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });

    const { data: upload, error: uploadError } = await supabase.storage
      .from("recipe-media")
      .upload(`recipes/${recipe.id}/cover.jpg`, compressed, { upsert: true });

    if (uploadError) {
      showToast("Upload failed — try again");
      setUploadingCover(false);
      return;
    }

    if (upload) {
      // Bust the CDN cache by appending a timestamp to the URL
      const { data: urlData } = supabase.storage.from("recipe-media").getPublicUrl(upload.path);
      const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("recipes").update({ cover_image_url: urlData.publicUrl }).eq("id", recipe.id);
      setRecipe((prev) => prev ? { ...prev, cover_image_url: freshUrl } : prev);
      showToast("Cover photo updated");
    }
    setUploadingCover(false);
  };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [
        { data: recipeData },
        { data: ingredientData },
        { data: stepData },
        { data: tagData },
        { data: commentData },
        { data: memoryData },
        { data: versionData },
        { data: profileData },
      ] = await Promise.all([
        supabase.from("recipes").select("id, title, description, notes, cook_time, yield, is_public, user_id, original_image_url, voice_recording_url, voice_recorded_by, cover_image_url").eq("id", id).single(),
        supabase.from("recipe_ingredients").select("id, section, items, sort_order").eq("recipe_id", id).order("sort_order"),
        supabase.from("recipe_steps").select("id, content, sort_order").eq("recipe_id", id).order("sort_order"),
        supabase.from("recipe_tags").select("tag").eq("recipe_id", id),
        supabase.from("recipe_comments").select("id, content, created_at, user_id").eq("recipe_id", id).order("created_at"),
        supabase.from("recipe_memories").select("id, content, created_at, user_id, tagged_people").eq("recipe_id", id).order("created_at"),
        supabase.from("recipe_versions").select("id, label, notes, created_at, author_id").eq("recipe_id", id).order("created_at"),
        supabase.from("profiles").select("id, name, email").eq("id", user.id).single(),
      ]);

      if (!recipeData) { router.push("/recipes"); return; }

      setRecipe(recipeData as Recipe);
      setIngredients((ingredientData ?? []) as IngredientGroup[]);
      setSteps((stepData ?? []) as Step[]);
      setTags((tagData ?? []).map((t: { tag: string }) => t.tag));
      setComments((commentData ?? []) as Comment[]);
      setMemories((memoryData ?? []) as Memory[]);
      setVersions((versionData ?? []) as Version[]);

      const name = profileData?.name ?? profileData?.email?.split("@")[0] ?? "You";
      setCurrentUser({ id: user.id, name });

      setLoading(false);
    };
    load();
  }, [id, router]);

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-stone-200 rounded w-8" />
          <div className="h-8 bg-stone-200 rounded w-64" />
          <div className="h-4 bg-stone-200 rounded w-48" />
          <div className="h-48 bg-stone-200 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!recipe) return null;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "recipe", label: "Recipe", icon: <BookHeart className="w-3.5 h-3.5" /> },
    { key: "memories", label: "Memories", icon: <Tag className="w-3.5 h-3.5" /> },
    { key: "versions", label: "Versions", icon: <GitBranch className="w-3.5 h-3.5" /> },
  ];

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    setSavingComment(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("recipe_comments")
      .insert({ recipe_id: id, user_id: currentUser.id, content: newComment.trim() })
      .select("id, content, created_at, user_id")
      .single();
    if (data) { setComments((prev) => [...prev, data as Comment]); setNewComment(""); showToast("Comment added"); }
    setSavingComment(false);
  };

  const handleAddMemory = async () => {
    if (!newMemory.trim() || !currentUser) return;
    setSavingMemory(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("recipe_memories")
      .insert({ recipe_id: id, user_id: currentUser.id, content: newMemory.trim(), tagged_people: [] })
      .select("id, content, created_at, user_id, tagged_people")
      .single();
    if (data) { setMemories((prev) => [...prev, data as Memory]); setNewMemory(""); showToast("Memory saved"); }
    setSavingMemory(false);
  };

  const startEditing = () => {
    if (!recipe) return;
    setEditTitle(recipe.title);
    setEditCookTime(recipe.cook_time ?? "");
    setEditYield(recipe.yield ?? "");
    setEditNotes(recipe.notes ?? "");
    setEditIngredients(
      ingredients.flatMap((g) =>
        g.section ? [`[${g.section}]`, ...g.items] : g.items
      ).join("\n")
    );
    setEditSteps(steps.map((s) => s.content).join("\n"));
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!recipe || !currentUser) return;
    setSavingEdit(true);
    const supabase = createClient();

    await supabase.from("recipes").update({
      title: editTitle.trim(),
      cook_time: editCookTime.trim() || null,
      yield: editYield.trim() || null,
      notes: editNotes.trim() || null,
    }).eq("id", id);

    // Rebuild ingredients
    await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
    const lines = editIngredients.split("\n").map((l) => l.trim()).filter(Boolean);
    const groups: { section: string | null; items: string[] }[] = [];
    let current: { section: string | null; items: string[] } = { section: null, items: [] };
    for (const line of lines) {
      if (line.startsWith("[") && line.endsWith("]")) {
        if (current.items.length > 0 || current.section) groups.push(current);
        current = { section: line.slice(1, -1), items: [] };
      } else {
        current.items.push(line);
      }
    }
    if (current.items.length > 0 || current.section) groups.push(current);
    if (groups.length > 0) {
      await supabase.from("recipe_ingredients").insert(
        groups.map((g, i) => ({ recipe_id: id, section: g.section, items: g.items, sort_order: i }))
      );
    }

    // Rebuild steps
    await supabase.from("recipe_steps").delete().eq("recipe_id", id);
    const stepLines = editSteps.split("\n").map((l) => l.trim()).filter(Boolean);
    if (stepLines.length > 0) {
      await supabase.from("recipe_steps").insert(
        stepLines.map((content, i) => ({ recipe_id: id, content, sort_order: i }))
      );
    }

    // Refresh local state
    const [{ data: newIngredients }, { data: newSteps }] = await Promise.all([
      supabase.from("recipe_ingredients").select("id, section, items, sort_order").eq("recipe_id", id).order("sort_order"),
      supabase.from("recipe_steps").select("id, content, sort_order").eq("recipe_id", id).order("sort_order"),
    ]);
    setRecipe((prev) => prev ? {
      ...prev,
      title: editTitle.trim(),
      cook_time: editCookTime.trim() || null,
      yield: editYield.trim() || null,
      notes: editNotes.trim() || null,
    } : prev);
    setIngredients((newIngredients ?? []) as IngredientGroup[]);
    setSteps((newSteps ?? []) as Step[]);
    setEditing(false);
    setSavingEdit(false);
    showToast("Recipe saved");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const nameFor = (userId: string) =>
    currentUser?.id === userId ? (currentUser?.name ?? "You") : "Family member";

  const initial = (name: string) => name[0]?.toUpperCase() ?? "?";

  return (
    <>
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-stone-100 z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="flex items-center gap-1 text-xs text-stone-400">
            {recipe.is_public ? <><Globe className="w-3 h-3" /> Public</> : <><Lock className="w-3 h-3" /> Private</>}
          </span>
        </div>
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${tab === key ? "bg-amber-600 text-white" : "text-stone-500 hover:bg-stone-100"}`}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Cover photo hero */}
      <div className="relative group">
        {recipe.cover_image_url ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={recipe.cover_image_url} alt={recipe.title} className="w-full h-56 object-cover" />
            <label className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full cursor-pointer hover:bg-black/70 transition-colors flex items-center gap-1.5">
              {uploadingCover ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Uploading...</> : "✏️ Change photo"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f, e.target); }} />
            </label>
          </div>
        ) : (
          <label className="block w-full h-40 bg-gradient-to-br from-amber-50 to-stone-100 border-b border-stone-100 cursor-pointer hover:from-amber-100 transition-colors flex flex-col items-center justify-center gap-2 group">
            {uploadingCover
              ? <><span className="w-5 h-5 border-2 border-amber-400/40 border-t-amber-600 rounded-full animate-spin" /><span className="text-stone-400 text-xs">Uploading...</span></>
              : <><span className="text-3xl">📷</span><span className="text-stone-400 text-sm">Add a cover photo</span></>}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f, e.target); }} />
          </label>
        )}
      </div>

      <div className="px-4 py-5">
        {editing ? (
          <div className="mb-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl font-serif text-stone-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 mb-2"
            />
            <div className="flex items-center gap-2">
              <button onClick={handleSaveEdit} disabled={savingEdit}
                className="flex items-center gap-1 text-xs text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 font-medium">
                {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full transition-colors">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 mb-1">
            <h1 className="text-2xl font-serif text-stone-800 flex-1">{recipe.title}</h1>
            {currentUser && (
              <button onClick={startEditing}
                className="mt-1 text-stone-400 hover:text-amber-600 transition-colors shrink-0">
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {!editing && recipe.description && <p className="text-stone-500 text-sm mb-3">{recipe.description}</p>}
        <div className="flex items-center gap-4 text-stone-400 text-xs mb-4">
          {editing ? (
            <>
              <input value={editCookTime} onChange={(e) => setEditCookTime(e.target.value)} placeholder="Cook time"
                className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-24 focus:outline-none focus:border-amber-400 text-stone-700" />
              <input value={editYield} onChange={(e) => setEditYield(e.target.value)} placeholder="Serves"
                className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-20 focus:outline-none focus:border-amber-400 text-stone-700" />
            </>
          ) : (
            <>
              {recipe.cook_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.cook_time}</span>}
              {recipe.yield && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{recipe.yield}</span>}
            </>
          )}
          {!editing && (
            <span className="ml-auto flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />{comments.length}
              <Tag className="w-3 h-3 ml-2" />{memories.length}
            </span>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-6">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* ── RECIPE TAB ── */}
        {tab === "recipe" && (
          <div className="space-y-6">

            {/* Original handwritten scan */}
            {recipe.original_image_url && (
              <details className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                <summary className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400 cursor-pointer select-none hover:bg-stone-50">
                  📜 Original card
                </summary>
                <div className="px-4 pb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={recipe.original_image_url} alt="Original handwritten card" className="w-full rounded-lg object-contain max-h-80" />
                </div>
              </details>
            )}

            {/* Voice recording */}
            {recipe.voice_recording_url && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">
                  🎙️ {recipe.voice_recorded_by ? `Recorded by ${recipe.voice_recorded_by}` : "Voice recording"}
                </p>
                <audio controls src={recipe.voice_recording_url} className="w-full" />
              </div>
            )}

            {editing ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Ingredients</h2>
                <p className="text-[10px] text-stone-400 mb-2">One per line. Use [Section Name] for groups.</p>
                <textarea
                  value={editIngredients}
                  onChange={(e) => setEditIngredients(e.target.value)}
                  rows={Math.max(6, editIngredients.split("\n").length + 1)}
                  className="w-full text-sm bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </section>
            ) : ingredients.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Ingredients</h2>
                <div className="space-y-5">
                  {ingredients.map((group) => (
                    <div key={group.id}>
                      {group.section && (
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">{group.section}</p>
                      )}
                      <ul className="space-y-2">
                        {group.items.map((ing, i) => (
                          <li key={i} className="flex items-start gap-2 text-stone-700 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {editing ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Instructions</h2>
                <p className="text-[10px] text-stone-400 mb-2">One step per line.</p>
                <textarea
                  value={editSteps}
                  onChange={(e) => setEditSteps(e.target.value)}
                  rows={Math.max(6, editSteps.split("\n").length + 1)}
                  className="w-full text-sm bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </section>
            ) : steps.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">Instructions</h2>
                <ol className="space-y-4">
                  {steps.map((step, i) => (
                    <li key={step.id} className="flex gap-3 text-sm text-stone-700">
                      <span className="font-serif text-amber-600 text-lg leading-snug shrink-0 w-5">{i + 1}</span>
                      <span className="leading-relaxed">{step.content}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {editing ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">Family notes</h2>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="Any notes about this recipe..."
                  className="w-full text-sm bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none"
                />
              </section>
            ) : recipe.notes ? (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-2">Family notes</p>
                <p className="text-stone-600 text-sm leading-relaxed italic">{recipe.notes}</p>
              </div>
            ) : null}

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Comments</h2>
              {comments.length > 0 && (
                <div className="space-y-3 mb-3">
                  {comments.map((c) => {
                    const name = nameFor(c.user_id);
                    return (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600 shrink-0">
                          {initial(name)}
                        </div>
                        <div className="bg-white rounded-xl border border-stone-100 px-3 py-2 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-medium text-stone-600">{name}</p>
                            <p className="text-xs text-stone-300">{formatDate(c.created_at)}</p>
                          </div>
                          <p className="text-sm text-stone-700">{c.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm bg-white border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400"
                />
                <button onClick={handleAddComment} disabled={savingComment}
                  className="bg-amber-600 text-white rounded-xl px-3 hover:bg-amber-700 transition-colors disabled:opacity-50">
                  {savingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ── MEMORIES TAB ── */}
        {tab === "memories" && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500">Stories, moments, and people connected to this recipe. These live alongside it forever.</p>
            {memories.map((m) => {
              const name = nameFor(m.user_id);
              return (
                <div key={m.id} className="bg-white border border-stone-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600">{initial(name)}</div>
                    <div>
                      <p className="text-xs font-medium text-stone-700">{name}</p>
                      <p className="text-xs text-stone-400">{formatDate(m.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed italic">&ldquo;{m.content}&rdquo;</p>
                  {m.tagged_people.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {m.tagged_people.map((p) => (
                        <span key={p} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />{p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1"><Plus className="w-3 h-3" /> Add a memory</p>
              <textarea
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Share a story, a moment, a memory connected to this recipe..."
                rows={3}
                className="w-full text-sm bg-white border border-amber-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none"
              />
              <button onClick={handleAddMemory} disabled={savingMemory}
                className="mt-2 w-full bg-amber-600 text-white text-sm py-2.5 rounded-xl hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {savingMemory ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save memory"}
              </button>
            </div>
          </div>
        )}

        {/* ── VERSIONS TAB ── */}
        {tab === "versions" && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500">Different people make this differently. Each version is a branch of the same root recipe.</p>
            {versions.length === 0 && (
              <div className="text-center py-8 text-stone-400 text-sm">No versions yet. Be the first to save yours.</div>
            )}
            {versions.map((v, i) => {
              const authorName = v.author_id ? nameFor(v.author_id) : "Unknown";
              return (
                <div key={v.id} className={`bg-white border rounded-2xl p-4 ${i === 0 ? "border-amber-200" : "border-stone-100"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                    <p className="font-medium text-stone-800 text-sm">{v.label}</p>
                    {i === 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Original</span>}
                  </div>
                  <p className="text-xs text-stone-400 mb-2">by {authorName} · {formatDate(v.created_at)}</p>
                  {v.notes && <p className="text-stone-600 text-sm italic">{v.notes}</p>}
                </div>
              );
            })}
            <button className="w-full border-2 border-dashed border-stone-200 rounded-2xl p-4 text-stone-400 text-sm flex items-center justify-center gap-2 hover:border-amber-300 hover:text-amber-600 transition-colors">
              <Plus className="w-4 h-4" /> Save my version of this recipe
            </button>
          </div>
        )}
      </div>
    </main>
    {toast && <Toast message={toast} onDone={clearToast} />}
    </>
  );
}
