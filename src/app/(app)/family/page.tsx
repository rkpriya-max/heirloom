"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Family {
  id: string;
  name: string;
  description: string | null;
  role: string;
}

export default function FamilyLandingPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("family_members")
        .select("role, families(id, name, description)")
        .eq("user_id", user.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list: Family[] = (data ?? []).map((row: any) => {
        const fam = Array.isArray(row.families) ? row.families[0] : row.families;
        return { id: fam?.id ?? "", name: fam?.name ?? "Unnamed", description: fam?.description ?? null, role: row.role };
      }).filter((f: Family) => f.id);

      setFamilies(list);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-16 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 pt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-stone-800">Family</h1>
        <Link
          href="/family/new"
          className="flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New family
        </Link>
      </div>

      {families.length === 0 ? (
        <div className="flex flex-col items-center text-center pt-12">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <Users className="w-9 h-9 text-amber-600" />
          </div>
          <h2 className="text-lg font-serif text-stone-800 mb-2">No families yet</h2>
          <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-xs">
            Create a family archive to share recipes and build a collection across generations.
          </p>
          <Link
            href="/family/new"
            className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3.5 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create a family
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {families.map((f) => (
            <Link
              key={f.id}
              href={`/family/${f.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 px-4 py-4 hover:border-stone-200 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">🏠</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-800 truncate">{f.name}</p>
                {f.description && <p className="text-xs text-stone-400 truncate mt-0.5">{f.description}</p>}
                <p className="text-xs text-amber-600 mt-1 capitalize">{f.role}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
