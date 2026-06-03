"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Users, LogOut, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Onboarding, { useOnboarding } from "@/components/Onboarding";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface Profile {
  name: string | null;
  email: string | null;
  created_at: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

  const handleOnboardingDone = () => {
    dismissOnboarding();
    const redirect = localStorage.getItem("heirloom_post_onboard");
    if (redirect) {
      localStorage.removeItem("heirloom_post_onboard");
      router.push(redirect);
    }
  };

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile sheet
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: prof }, { data: recs }] = await Promise.all([
        supabase.from("profiles").select("name, email, created_at").eq("id", user.id).single(),
        supabase.from("recipes").select("id, title, description, created_at")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      // Returning user on a new device — skip onboarding via Supabase metadata
      if (user.user_metadata?.onboarded) {
        localStorage.setItem("heirloom_onboarded", "true");
        dismissOnboarding();
      }

      setUserId(user.id);
      setProfile(prof);
      setEditName(prof?.name ?? "");
      setRecipes(recs ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleSaveName = async () => {
    if (!editName.trim() || !userId) return;
    setSavingName(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ name: editName.trim() }).eq("id", userId);
    setProfile((p) => p ? { ...p, name: editName.trim() } : p);
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => { setNameSaved(false); setShowProfile(false); }, 1000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName = profile?.name ?? profile?.email?.split("@")[0] ?? "…";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-32" />
          <div className="h-32 bg-stone-200 rounded-2xl" />
          <div className="h-24 bg-stone-200 rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <>
      {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}

      <main className="max-w-lg mx-auto px-4 pt-10 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-sm">{getGreeting()}</p>
            <h1 className="text-2xl font-serif text-stone-800">{displayName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold hover:bg-amber-200 transition-colors"
            >
              {initial}
            </button>
            <button onClick={handleSignOut} className="text-stone-300 hover:text-stone-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/recipes/new" className="bg-amber-600 text-white rounded-2xl p-4 flex flex-col gap-2 hover:bg-amber-700 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="font-medium text-sm">Add recipe</span>
            <span className="text-amber-200 text-xs">Scan or type</span>
          </Link>
          <Link href="/family" className="bg-stone-800 text-white rounded-2xl p-4 flex flex-col gap-2 hover:bg-stone-900 transition-colors">
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Family</span>
            <span className="text-stone-400 text-xs">Share & preserve</span>
          </Link>
        </div>

        {/* Recipes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              My recipes {recipes.length > 0 && `(${recipes.length})`}
            </h2>
            <Link href="/recipes" className="text-xs text-amber-600">See all</Link>
          </div>

          {recipes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-stone-600 font-medium mb-1">No recipes yet</p>
              <p className="text-stone-400 text-sm mb-4">Scan a handwritten card or type one in.</p>
              <Link href="/recipes/new" className="text-amber-600 text-sm font-medium">Add your first recipe →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recipes.map((r) => (
                <Link key={r.id} href={`/recipes/${r.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3 hover:border-stone-200 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🍲</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm truncate">{r.title}</p>
                    {r.description && <p className="text-xs text-stone-400 truncate mt-0.5">{r.description}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Profile sheet */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowProfile(false)}>
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-stone-800 text-lg">Your name</h2>
              <button onClick={() => setShowProfile(false)} className="text-stone-300 hover:text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
            />
            {profile?.email && (
              <p className="text-stone-400 text-xs px-1">{profile.email}</p>
            )}
            <button
              onClick={handleSaveName}
              disabled={savingName || !editName.trim()}
              className={`w-full py-3.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2
                ${nameSaved ? "bg-green-100 text-green-700" : "bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"}`}
            >
              {nameSaved ? "✓ Saved" : savingName ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
