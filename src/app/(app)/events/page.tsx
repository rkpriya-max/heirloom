"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, CalendarDays, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("events")
        .select("id, title, description, event_date")
        .eq("host_id", user.id)
        .order("event_date", { ascending: true });

      setEvents(data ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const isPast = (d: string) => new Date(d) < new Date();

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-10">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-stone-200 rounded w-32" />
          {[1, 2].map((i) => <div key={i} className="h-24 bg-stone-200 rounded-2xl" />)}
        </div>
      </main>
    );
  }

  const upcoming = events.filter((e) => !isPast(e.event_date));
  const past = events.filter((e) => isPast(e.event_date));

  return (
    <main className="max-w-lg mx-auto px-4 pt-10 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-stone-800">Events</h1>
        <Link href="/events/new" className="bg-stone-800 text-white rounded-full p-2 hover:bg-stone-900 transition-colors">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7 text-stone-400" />
          </div>
          <p className="text-stone-600 font-medium mb-1">No events yet</p>
          <p className="text-stone-400 text-sm mb-4">Create an event and build a menu from your recipe collection.</p>
          <Link href="/events/new" className="text-amber-600 text-sm font-medium">Create your first event →</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map((e) => (
                  <Link key={e.id} href={`/events/${e.id}`}
                    className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 p-4 hover:border-stone-200 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm">{e.title}</p>
                      <p className="text-xs text-amber-600 mt-0.5">{formatDate(e.event_date)}</p>
                      {e.description && <p className="text-xs text-stone-400 mt-0.5 truncate">{e.description}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Past</h2>
              <div className="space-y-2">
                {past.map((e) => (
                  <Link key={e.id} href={`/events/${e.id}`}
                    className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 p-4 hover:border-stone-200 transition-colors opacity-60">
                    <div className="w-12 h-12 rounded-xl bg-stone-200 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-stone-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm">{e.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{formatDate(e.event_date)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
