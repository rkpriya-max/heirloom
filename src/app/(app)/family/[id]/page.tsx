"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, UserPlus, BookOpen, ChevronRight, Crown } from "lucide-react";
import { MOCK_FAMILY, MOCK_RECIPES } from "@/lib/mock-data";

type Tab = "feed" | "members";

export default function FamilyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("feed");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invited, setInvited] = useState(false);

  const sharedRecipes = MOCK_RECIPES.filter((r) => MOCK_FAMILY.shared_recipe_ids.includes(r.id));

  const ACTIVITY = [
    { avatar: "K", name: "Kavya", action: "added a memory to Patti's Puliyodharai", time: "2h ago", href: "/recipes/r3" },
    { avatar: "R", name: "Rajan Uncle", action: "commented on Amma's Sambar Podi", time: "5h ago", href: "/recipes/r1" },
    { avatar: "M", name: "Meena Aunty", action: "saved Muligapodi to her collection", time: "1d ago", href: "/recipes/r2" },
  ];

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-100 z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 text-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 text-sm text-amber-600 font-medium">
            <UserPlus className="w-4 h-4" /> Invite
          </button>
        </div>
        <div className="mb-3">
          <h1 className="text-xl font-serif text-stone-800">{MOCK_FAMILY.name}</h1>
          <p className="text-stone-400 text-xs">{MOCK_FAMILY.members.length} members · {sharedRecipes.length} shared recipes</p>
        </div>

        {/* Member avatars */}
        <div className="flex items-center gap-1.5 mb-3">
          {MOCK_FAMILY.members.map((m) => (
            <div key={m.id} className="relative">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-700">
                {m.avatar}
              </div>
              {m.role === "admin" && (
                <Crown className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
              )}
            </div>
          ))}
          <button onClick={() => setShowInvite(true)} className="w-8 h-8 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-300 hover:border-amber-400 hover:text-amber-400 transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(["feed", "members"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize
                ${tab === t ? "bg-amber-600 text-white" : "text-stone-500 hover:bg-stone-100"}`}>
              {t === "feed" ? `Shared recipes (${sharedRecipes.length})` : `Members (${MOCK_FAMILY.members.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        {/* ── FEED TAB ── */}
        {tab === "feed" && (
          <div className="space-y-6">
            {/* Recent activity */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Recent activity</h2>
              <div className="space-y-2">
                {ACTIVITY.map((item, i) => (
                  <Link key={i} href={item.href} className="flex items-start gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3 hover:border-stone-200 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-medium shrink-0">{item.avatar}</div>
                    <div className="flex-1">
                      <p className="text-sm text-stone-700"><span className="font-medium">{item.name}</span> {item.action}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{item.time}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Shared recipes */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Shared recipes</h2>
                <Link href="/recipes" className="text-xs text-amber-600 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Add recipe</Link>
              </div>
              <div className="space-y-3">
                {sharedRecipes.map((r) => (
                  <Link key={r.id} href={`/recipes/${r.id}`} className="flex gap-3 bg-white rounded-2xl border border-stone-100 p-4 hover:border-stone-200 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🍲</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm">{r.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">by {r.author_name}</p>
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-[10px] text-stone-400">{r.comments.length} comments · {r.memories.length} memories</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 self-center shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && (
          <div className="space-y-3">
            {MOCK_FAMILY.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-sm font-medium text-stone-700">
                  {m.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-stone-800 text-sm">{m.name}</p>
                  <p className="text-xs text-stone-400">Joined {m.joined}</p>
                </div>
                {m.role === "admin" && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
            ))}

            <button onClick={() => setShowInvite(true)} className="w-full border-2 border-dashed border-stone-200 rounded-xl py-4 text-stone-400 text-sm flex items-center justify-center gap-2 hover:border-amber-300 hover:text-amber-600 transition-colors">
              <UserPlus className="w-4 h-4" /> Invite a family member
            </button>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowInvite(false)}>
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-stone-800 text-lg mb-1">Invite to family</h2>
            <p className="text-stone-400 text-sm mb-5">They&apos;ll get access to all shared recipes and can add memories and comments.</p>
            {!invited ? (
              <>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 mb-3"
                />
                <button
                  onClick={() => { if (inviteEmail) setInvited(true); }}
                  className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors"
                >
                  Send invite
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✉️</div>
                <p className="font-medium text-stone-800">Invite sent to {inviteEmail}</p>
                <p className="text-stone-400 text-sm mt-1">They&apos;ll receive a link to join the family archive.</p>
                <button onClick={() => { setShowInvite(false); setInvited(false); setInviteEmail(""); }} className="mt-4 text-amber-600 text-sm">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
