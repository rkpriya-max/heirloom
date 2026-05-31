"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, UserPlus, ChevronRight, Crown, Loader2, BookOpen, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

type Tab = "recipes" | "members";

interface Family { id: string; name: string; description: string | null }
interface Member { user_id: string; role: string; joined_at: string }
interface SharedRecipe {
  recipe_id: string;
  // Supabase returns the joined row as an array even for 1:1 joins
  recipes: {
    id: string;
    title: string;
    description: string | null;
    notes: string | null;
  }[] | null;
}

export default function FamilyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [sharedRecipes, setSharedRecipes] = useState<SharedRecipe[]>([]);
  const [myRecipes, setMyRecipes] = useState<{ id: string; title: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [myRole, setMyRole] = useState<string>("member");

  const [tab, setTab] = useState<Tab>("recipes");
  const [showInvite, setShowInvite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [
        { data: familyData },
        { data: memberData },
        { data: sharedData },
        { data: profileData },
        { data: myRecipeData },
      ] = await Promise.all([
        supabase.from("families").select("id, name, description").eq("id", id).single(),
        supabase.from("family_members").select("user_id, role, joined_at").eq("family_id", id),
        supabase.from("family_recipes").select("recipe_id, recipes(id, title, description, notes)").eq("family_id", id),
        supabase.from("profiles").select("id, name, email").eq("id", user.id).single(),
        supabase.from("recipes").select("id, title").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (!familyData) { router.push("/family"); return; }

      setFamily(familyData);
      setMembers(memberData ?? []);
      setSharedRecipes((sharedData ?? []) as SharedRecipe[]);
      setCurrentUser({ id: user.id, name: profileData?.name ?? profileData?.email?.split("@")[0] ?? "You" });
      setMyRole(memberData?.find((m) => m.user_id === user.id)?.role ?? "member");
      setMyRecipes(myRecipeData ?? []);

      const alreadyShared = new Set((sharedData ?? []).map((s) => s.recipe_id));
      setSharedIds(alreadyShared);

      setLoading(false);
    };
    load();
  }, [id, router]);

  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    setInviting(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("family_invites")
      .insert({
        family_id: id,
        invited_by: currentUser?.id,
      })
      .select("token")
      .single();
    const link = data?.token
      ? `${window.location.origin}/join/${data.token}`
      : "";
    setInviteLink(link);
    setInviting(false);
    setInvited(true);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    // Use native share sheet on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${family?.name} on Heirloom`, url: inviteLink });
        return;
      } catch { /* user cancelled share */ return; }
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        // Fallback for older/restricted browsers
        const el = document.createElement("textarea");
        el.value = inviteLink;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: show the link so user can copy manually
      setCopied(false);
    }
  };

  const handleShare = async (recipeId: string) => {
    if (sharedIds.has(recipeId)) return;
    setSharing(recipeId);
    const supabase = createClient();
    const { error } = await supabase.from("family_recipes").insert({
      family_id: id,
      recipe_id: recipeId,
      shared_by: currentUser?.id,
    });
    if (!error) {
      setSharedIds((prev) => new Set([...prev, recipeId]));
      const recipe = myRecipes.find((r) => r.id === recipeId);
      if (recipe) {
        setSharedRecipes((prev) => [...prev, {
          recipe_id: recipeId,
          recipes: [{ id: recipeId, title: recipe.title, description: null, notes: null }],
        }]);
      }
    }
    setSharing(null);
  };

  const nameFor = (userId: string) =>
    currentUser?.id === userId ? currentUser.name : "Family member";

  const initial = (name: string) => name[0]?.toUpperCase() ?? "?";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="h-4 bg-stone-200 rounded w-32" />
          <div className="h-32 bg-stone-200 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!family) return null;

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => router.back()} className="text-stone-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
            <UserPlus className="w-4 h-4" /> Invite
          </button>
        </div>

        <div className="mb-3">
          <h1 className="text-xl font-serif text-stone-800">{family.name}</h1>
          <p className="text-stone-400 text-xs">
            {members.length} member{members.length !== 1 ? "s" : ""} · {sharedRecipes.length} shared recipe{sharedRecipes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Member avatars */}
        <div className="flex items-center gap-1.5 mb-3">
          {members.slice(0, 6).map((m) => {
            const name = nameFor(m.user_id);
            return (
              <div key={m.user_id} className="relative">
                <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-700">
                  {initial(name)}
                </div>
                {m.role === "admin" && (
                  <Crown className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
                )}
              </div>
            );
          })}
          <button onClick={() => setShowInvite(true)}
            className="w-8 h-8 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 hover:border-amber-400 hover:text-amber-400 transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-1">
          {(["recipes", "members"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize
                ${tab === t ? "bg-amber-600 text-white" : "text-stone-500 hover:bg-stone-100"}`}>
              {t === "recipes" ? `Recipes (${sharedRecipes.length})` : `Members (${members.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        {/* ── RECIPES TAB ── */}
        {tab === "recipes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-400">Recipes shared with this family</p>
              <button onClick={() => setShowShare(true)}
                className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <BookOpen className="w-3.5 h-3.5" /> Share a recipe
              </button>
            </div>

            {sharedRecipes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🍲</div>
                <p className="text-stone-600 font-medium mb-1">No recipes shared yet</p>
                <p className="text-stone-400 text-sm mb-4">Share your recipes so the family can read them, comment, and add memories.</p>
                <button onClick={() => setShowShare(true)} className="text-amber-600 text-sm font-medium">
                  Share your first recipe →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedRecipes.map(({ recipe_id, recipes: rArr }) => {
                  const r = Array.isArray(rArr) ? rArr[0] : rArr;
                  return r ? (
                  <Link key={recipe_id} href={`/recipes/${r.id}`}
                    className="flex gap-3 bg-white rounded-2xl border border-stone-100 p-4 hover:border-stone-200 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🍲</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm">{r.title}</p>
                      {r.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{r.description}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 self-center shrink-0" />
                  </Link>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && (
          <div className="space-y-3">
            {members.map((m) => {
              const name = nameFor(m.user_id);
              return (
                <div key={m.user_id} className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-sm font-medium text-stone-700">
                    {initial(name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-800 text-sm">{name}</p>
                    <p className="text-xs text-stone-400">Joined {formatDate(m.joined_at)}</p>
                  </div>
                  {m.role === "admin" && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>
              );
            })}
            <button onClick={() => setShowInvite(true)}
              className="w-full border-2 border-dashed border-stone-200 rounded-xl py-4 text-stone-400 text-sm flex items-center justify-center gap-2 hover:border-amber-300 hover:text-amber-600 transition-colors">
              <UserPlus className="w-4 h-4" /> Invite a family member
            </button>
          </div>
        )}
      </div>

      {/* ── INVITE MODAL ── */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => { setShowInvite(false); setInvited(false); setCopied(false); }}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-stone-800 text-lg mb-1">Invite to {family.name}</h2>
            <p className="text-stone-400 text-sm mb-5">
              Share this link. Anyone with it can join your family.
            </p>
            {!invited ? (
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : "Generate invite link"}
              </button>
            ) : (
              <>
                {inviteLink && (
                  <div className="bg-stone-50 rounded-xl border border-stone-200 p-3 mb-3">
                    <p className="text-xs text-stone-500 font-mono break-all leading-relaxed">{inviteLink}</p>
                  </div>
                )}
                <button
                  onClick={handleCopyLink}
                  className={`w-full py-3.5 rounded-xl font-medium text-sm transition-colors mb-2
                    ${copied ? "bg-green-100 text-green-700" : "bg-amber-600 text-white hover:bg-amber-700"}`}
                >
                  {copied ? "✓ Copied!" : (typeof navigator !== "undefined" && navigator.share ? "Share link" : "Copy link")}
                </button>
                <button
                  onClick={() => { setShowInvite(false); setInvited(false); setCopied(false); }}
                  className="w-full text-stone-400 text-sm py-2">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── SHARE RECIPE MODAL ── */}
      {showShare && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onClick={() => setShowShare(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-stone-800 text-lg mb-1 shrink-0">Share a recipe</h2>
            <p className="text-stone-400 text-sm mb-4 shrink-0">Choose a recipe from your collection to share with {family.name}.</p>
            <div className="overflow-y-auto space-y-2 flex-1">
              {myRecipes.length === 0 && (
                <div className="text-center py-8 text-stone-400 text-sm">
                  You don&apos;t have any recipes yet.{" "}
                  <Link href="/recipes/new" className="text-amber-600">Add one →</Link>
                </div>
              )}
              {myRecipes.map((r) => {
                const isShared = sharedIds.has(r.id);
                return (
                  <button key={r.id} onClick={() => handleShare(r.id)} disabled={isShared || sharing === r.id}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors
                      ${isShared ? "border-green-200 bg-green-50" : "border-stone-100 bg-white hover:border-stone-200"}`}>
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-lg shrink-0">🍲</div>
                    <p className="flex-1 text-sm font-medium text-stone-800">{r.title}</p>
                    {isShared
                      ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      : sharing === r.id
                      ? <Loader2 className="w-4 h-4 animate-spin text-stone-400 shrink-0" />
                      : <span className="text-xs text-amber-600 shrink-0">Share</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowShare(false)} className="mt-4 w-full text-stone-400 text-sm shrink-0">Done</button>
          </div>
        </div>
      )}
    </main>
  );
}
