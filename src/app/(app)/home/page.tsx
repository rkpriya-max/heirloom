"use client";

import Link from "next/link";
import { Plus, Flame, Users, CalendarDays, ChevronRight } from "lucide-react";
import { MOCK_RECIPES, MOCK_FAMILY, MOCK_EVENTS, CURRENT_USER } from "@/lib/mock-data";

const ACTIVITY = [
  { id: 1, avatar: "K", name: "Kavya", action: "added a memory to", target: "Patti's Puliyodharai", time: "2h ago", href: "/recipes/r3" },
  { id: 2, avatar: "R", name: "Rajan Uncle", action: "commented on", target: "Amma's Sambar Podi", time: "5h ago", href: "/recipes/r1" },
  { id: 3, avatar: "M", name: "Meena Aunty", action: "joined the family", target: "", time: "1d ago", href: "/family/fam-1" },
];

export default function HomePage() {
  const recentRecipes = MOCK_RECIPES.slice(0, 3);
  const nextEvent = MOCK_EVENTS[0];

  return (
    <main className="max-w-lg mx-auto px-4 pt-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-stone-400 text-sm">Good morning</p>
          <h1 className="text-2xl font-serif text-stone-800">{CURRENT_USER.name}</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold">
          {CURRENT_USER.avatar}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/recipes/new" className="bg-amber-600 text-white rounded-2xl p-4 flex flex-col gap-2 hover:bg-amber-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span className="font-medium text-sm">Add recipe</span>
          <span className="text-amber-200 text-xs">Scan or type</span>
        </Link>
        <Link href="/events/new" className="bg-stone-800 text-white rounded-2xl p-4 flex flex-col gap-2 hover:bg-stone-900 transition-colors">
          <CalendarDays className="w-5 h-5" />
          <span className="font-medium text-sm">Create event</span>
          <span className="text-stone-400 text-xs">Build a menu</span>
        </Link>
      </div>

      {/* Upcoming event */}
      {nextEvent && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Next event</h2>
            <Link href="/events/ev1" className="text-xs text-amber-600">See all</Link>
          </div>
          <Link href={`/events/${nextEvent.id}`} className="block bg-white rounded-2xl border border-stone-100 p-4 hover:border-stone-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-stone-800">{nextEvent.title}</p>
                <p className="text-stone-400 text-sm mt-0.5">{new Date(nextEvent.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
                <p className="text-stone-500 text-xs mt-2">{nextEvent.menu_recipe_ids.length} recipes in menu · {nextEvent.guests.length} guests</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-2">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Family activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">Family activity</h2>
          <Link href="/family/fam-1" className="text-xs text-amber-600 flex items-center gap-0.5">
            <Users className="w-3 h-3" /> {MOCK_FAMILY.members.length} members
          </Link>
        </div>
        <div className="space-y-2">
          {ACTIVITY.map((item) => (
            <Link key={item.id} href={item.href} className="flex items-start gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3 hover:border-stone-200 transition-colors">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-sm font-medium shrink-0">
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-700">
                  <span className="font-medium">{item.name}</span> {item.action}
                  {item.target && <span className="font-medium"> {item.target}</span>}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">{item.time}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent recipes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400">My recipes</h2>
          <Link href="/recipes" className="text-xs text-amber-600">See all</Link>
        </div>
        <div className="space-y-2">
          {recentRecipes.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`} className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 px-4 py-3 hover:border-stone-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🍲</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-800 text-sm truncate">{r.title}</p>
                <p className="text-xs text-stone-400 mt-0.5">{r.tags.join(" · ")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
