"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface MenuRecipeItem {
  id: string;
  title: string;
  description: string | null;
  yield: string | null;
  cook_time: string | null;
  cover_image_url: string | null;
}

interface EventMenu {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  notes: string | null;
  recipes: MenuRecipeItem[];
}

export default function PublicMenuPage() {
  const { token } = useParams<{ token: string }>();
  const [menu, setMenu] = useState<EventMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc("get_event_menu", { p_token: token });

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setMenu(data as EventMenu);
      setLoading(false);
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-300 text-sm">Loading menu…</div>
      </main>
    );
  }

  if (notFound || !menu) {
    return (
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl mb-4">🍽️</div>
        <h1 className="text-xl font-serif text-stone-800 mb-2">Menu not found</h1>
        <p className="text-stone-400 text-sm">This link may have expired or been removed.</p>
      </main>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="bg-stone-800 text-white px-6 pt-14 pb-10">
        <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">You&apos;re invited</p>
        <h1 className="text-3xl font-serif mb-2 leading-snug">{menu.title}</h1>
        <p className="text-stone-300 text-sm">{formatDate(menu.event_date)}</p>
        {menu.description && (
          <p className="text-stone-400 text-sm mt-3 leading-relaxed">{menu.description}</p>
        )}
      </div>

      {/* Menu */}
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
          The menu — {menu.recipes.length} dish{menu.recipes.length !== 1 ? "es" : ""}
        </h2>

        {menu.recipes.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-8">No dishes added yet.</p>
        ) : (
          menu.recipes.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              {r.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.cover_image_url} alt={r.title} className="w-full h-44 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-serif text-stone-800 text-lg mb-1">{r.title}</h3>
                {r.description && <p className="text-stone-500 text-sm mb-3 leading-relaxed">{r.description}</p>}
                <div className="flex items-center gap-4 text-stone-400 text-xs">
                  {r.cook_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.cook_time}</span>}
                  {r.yield && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.yield}</span>}
                </div>
              </div>
            </div>
          ))
        )}

        {menu.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Notes from the host</p>
            <p className="text-stone-600 text-sm leading-relaxed italic">{menu.notes}</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-stone-100 py-8 px-4 text-center">
        <p className="text-stone-400 text-xs mb-3">Want to preserve your own family recipes?</p>
        <Link href="/signup"
          className="inline-block bg-amber-600 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors">
          Try Heirloom →
        </Link>
      </div>
    </main>
  );
}
