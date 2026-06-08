"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Loader2, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Onboarding, { useOnboarding } from "@/components/Onboarding";
import AIAssistant from "@/components/AIAssistant";
import { Wordmark, Ladle } from "@/components/Wordmark";

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

interface ActivityItem {
  id: string;
  type: "recipe_shared" | "member_joined";
  actor: string;
  text: string;
  familyName: string;
  createdAt: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getChatOpener(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Which dish takes you somewhere good the moment you think of it?";
  if (h >= 12 && h < 17) return "What dish do you want the next generation to know?";
  if (h >= 17 && h < 22) return "What's a family recipe that should never be forgotten?";
  return "Tell me about a dish that means something to you.";
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
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [chatOpener] = useState(getChatOpener);
  const [openChat, setOpenChat] = useState(false);

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

      // Activity feed — recent events from families the user belongs to
      const { data: membershipData } = await supabase
        .from("family_members")
        .select("family_id, families(id, name)")
        .eq("user_id", user.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const familyIds = (membershipData ?? []).map((m: any) => m.family_id);
      const familyNames: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (membershipData ?? []).forEach((m: any) => {
        const fam = Array.isArray(m.families) ? m.families[0] : m.families;
        if (fam?.id) familyNames[fam.id] = fam.name;
      });

      if (familyIds.length > 0) {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const [{ data: sharedRecipes }, { data: newMembers }] = await Promise.all([
          supabase.from("family_recipes")
            .select("recipe_id, family_id, shared_by, created_at, recipes(id, title)")
            .in("family_id", familyIds)
            .neq("shared_by", user.id)
            .gte("created_at", since)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase.from("family_members")
            .select("user_id, family_id, joined_at")
            .in("family_id", familyIds)
            .neq("user_id", user.id)
            .gte("joined_at", since)
            .order("joined_at", { ascending: false })
            .limit(10),
        ]);

        const actorIds = Array.from(new Set([
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(sharedRecipes ?? []).map((r: any) => r.shared_by),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(newMembers ?? []).map((m: any) => m.user_id),
        ].filter(Boolean)));

        const profileMap: Record<string, string> = {};
        if (actorIds.length > 0) {
          const { data: actorProfiles } = await supabase
            .from("profiles").select("id, name, email").in("id", actorIds);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (actorProfiles ?? []).forEach((p: any) => {
            profileMap[p.id] = p.name ?? p.email?.split("@")[0] ?? "Someone";
          });
        }

        const items: ActivityItem[] = [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(sharedRecipes ?? []).map((r: any) => {
            const recipe = Array.isArray(r.recipes) ? r.recipes[0] : r.recipes;
            return {
              id: `recipe-${r.recipe_id}-${r.family_id}`,
              type: "recipe_shared" as const,
              actor: profileMap[r.shared_by] ?? "Someone",
              text: recipe?.title ?? "a recipe",
              familyName: familyNames[r.family_id] ?? "your family",
              createdAt: r.created_at,
            };
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(newMembers ?? []).map((m: any) => ({
            id: `member-${m.user_id}-${m.family_id}`,
            type: "member_joined" as const,
            actor: profileMap[m.user_id] ?? "Someone",
            text: "",
            familyName: familyNames[m.family_id] ?? "your family",
            createdAt: m.joined_at,
          })),
        ]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setActivity(items);
      }

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
      {openChat && <AIAssistant defaultOpen={true} />}

      {/* Masthead */}
      <div className="border-b sticky top-0 z-10" style={{ background: 'rgba(243,233,215,0.88)', backdropFilter: 'blur(12px)', borderColor: 'var(--line)' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <Wordmark size={32} strokeWidth={3.8} />
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-8">

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

        {/* Chat hero */}
        <button
          onClick={() => setOpenChat(true)}
          className="w-full text-left rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(145deg, #9a2620 0%, var(--red) 55%, var(--red-deep) 100%)',
            padding: '22px 20px 18px',
            boxShadow: '0 14px 30px -16px rgba(122,27,26,0.7)',
          }}
        >
          {/* Decorative ladle watermark */}
          <div className="absolute pointer-events-none" style={{ right: -24, top: -24, width: 110, opacity: 0.10 }}>
            <Ladle color="#FFFDF8" strokeWidth={3} />
          </div>
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--mustard)' }}>
              <Sparkles className="w-3 h-3" style={{ color: '#3a2606' }} />
            </div>
            <span className="text-xs font-bold uppercase" style={{ color: 'var(--mustard-soft)', letterSpacing: '0.18em' }}>Ask Sunday&apos;s Lunch</span>
          </div>
          <p className="font-serif text-xl leading-snug mb-4" style={{ color: '#FFFDF8', maxWidth: '17ch' }}>{chatOpener}</p>
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'rgba(0,0,0,0.18)' }}>
            <span className="flex-1 text-sm" style={{ color: 'rgba(244,234,215,0.65)' }}>Tell me about a dish…</span>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--mustard-soft)' }} />
          </div>
        </button>

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

        {/* Activity feed */}
        {activity.length > 0 && (
          <section>
            <p className="text-sm font-medium text-stone-700 mb-3">What&apos;s cooking 🍳</p>
            <div className="space-y-2">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600 shrink-0 mt-0.5">
                    {item.actor[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.type === "recipe_shared" ? (
                      <p className="text-sm text-stone-800 leading-snug">
                        <span className="font-semibold">{item.actor}</span> shared <span className="font-semibold">{item.text}</span> in {item.familyName}
                      </p>
                    ) : (
                      <p className="text-sm text-stone-800 leading-snug">
                        <span className="font-semibold">{item.actor}</span> joined {item.familyName}
                      </p>
                    )}
                    <p className="text-xs text-amber-600 mt-0.5">{relativeTime(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feedback */}
        <Link
          href="/feedback"
          className="flex items-center gap-3 rounded-2xl px-4 py-4 transition-opacity hover:opacity-80"
          style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 1px 0 rgba(42,28,21,0.04), 0 6px 20px -12px rgba(42,28,21,0.15)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--mustard-wash)" }}>
            <svg viewBox="0 0 54 80" width={22} style={{ color: "var(--red)" }} aria-hidden="true">
              <path d="M37 6 C 25 4, 24 18, 33 19" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" />
              <path d="M33 19 C 35 31, 31 41, 27 48" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" />
              <path d="M10 48 A 16 16 0 0 0 42 48" fill="none" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" />
              <ellipse cx="26" cy="48" rx="16" ry="4.4" fill="none" stroke="currentColor" strokeWidth={3.6} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>How did we cook?</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-faint)" }}>Tell us what&apos;s working — and what&apos;s not.</p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--ink-faint)" }} />
        </Link>

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
