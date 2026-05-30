"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function NewFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Family name is required."); return; }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Create the family
    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({ name: name.trim(), description: description.trim() || null, created_by: user.id })
      .select("id")
      .single();

    if (familyError || !family) {
      setError("Failed to create family. Try again.");
      setSaving(false);
      return;
    }

    // Add creator as admin member
    await supabase
      .from("family_members")
      .insert({ family_id: family.id, user_id: user.id, role: "admin" });

    router.push(`/family/${family.id}`);
  };

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
          <ChevronLeft className="w-4 h-4" /> Cancel
        </button>
        <h1 className="font-serif text-stone-800">New family</h1>
        <button onClick={handleCreate} disabled={saving} className="text-sm text-amber-600 font-medium disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
        </button>
      </div>

      <div className="px-4 py-8 space-y-6">
        <div className="text-center mb-2">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl mx-auto mb-4">🏠</div>
          <p className="text-stone-400 text-sm">Give your family archive a name. You can always change it later.</p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Family name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Krishnamurti Family"
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What makes your family's food special?"
            rows={3}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create family archive"}
        </button>
      </div>
    </main>
  );
}
