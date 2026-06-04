"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus, ChevronRight, Loader2, Trash2, LogOut, CheckCircle2, Circle } from "lucide-react";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

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

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === families.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(families.map((f) => f.id)));
    }
  };

  const removeSelected = async () => {
    if (!userId || selected.size === 0) return;
    setActing(true);
    const supabase = createClient();
    const toLeave = families.filter((f) => selected.has(f.id) && f.role !== "admin").map((f) => f.id);
    const toDelete = families.filter((f) => selected.has(f.id) && f.role === "admin").map((f) => f.id);

    await Promise.all([
      toLeave.length > 0
        ? supabase.from("family_members").delete().in("family_id", toLeave).eq("user_id", userId)
        : Promise.resolve(),
      toDelete.length > 0
        ? supabase.from("families").delete().in("id", toDelete)
        : Promise.resolve(),
    ]);

    setFamilies((prev) => prev.filter((f) => !selected.has(f.id)));
    exitSelectMode();
    setActing(false);
  };

  const selectedFamilies = families.filter((f) => selected.has(f.id));
  const allAdmins = selectedFamilies.every((f) => f.role === "admin");
  const actionLabel = allAdmins ? "Delete" : "Remove";

  if (loading) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-16 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-stone-300" />
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 pt-10 pb-28 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-stone-800">Family</h1>
        <div className="flex items-center gap-2">
          {families.length > 0 && (
            <button
              onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1"
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          {!selectMode && (
            <Link
              href="/family/new"
              className="flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New family
            </Link>
          )}
        </div>
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
        <>
          {selectMode && (
            <div className="flex items-center justify-between px-1">
              <button onClick={toggleAll} className="text-xs text-amber-700 font-medium hover:text-amber-800 transition-colors">
                {selected.size === families.length ? "Deselect all" : "Select all"}
              </button>
              <span className="text-xs text-stone-400">{selected.size} selected</span>
            </div>
          )}

          <div className="space-y-2">
            {families.map((f) => {
              const isSelected = selected.has(f.id);
              const isAdmin = f.role === "admin";
              return (
                <div
                  key={f.id}
                  onClick={selectMode ? () => toggleSelect(f.id) : undefined}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all
                    ${selectMode ? "cursor-pointer" : "hover:border-stone-200"}
                    ${isSelected ? "border-amber-400 bg-amber-50/40" : "border-stone-100"}`}
                >
                  <div className="flex items-center gap-3 px-4 py-4">
                    {selectMode && (
                      <div className="shrink-0">
                        {isSelected
                          ? <CheckCircle2 className="w-5 h-5 text-amber-600" />
                          : <Circle className="w-5 h-5 text-stone-300" />}
                      </div>
                    )}

                    {selectMode ? (
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">🏠</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 truncate">{f.name}</p>
                          {f.description && <p className="text-xs text-stone-400 truncate mt-0.5">{f.description}</p>}
                          <p className="text-xs text-amber-600 mt-1 capitalize">{f.role}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Link href={`/family/${f.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">🏠</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-800 truncate">{f.name}</p>
                            {f.description && <p className="text-xs text-stone-400 truncate mt-0.5">{f.description}</p>}
                            <p className="text-xs text-amber-600 mt-1 capitalize">{f.role}</p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectMode(true); setSelected(new Set([f.id])); }}
                            className="p-1.5 text-stone-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                            aria-label={isAdmin ? "Delete family" : "Leave family"}
                          >
                            {isAdmin ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                          </button>
                          <ChevronRight className="w-4 h-4 text-stone-300" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-50">
          <div className="bg-stone-900 text-white rounded-2xl shadow-xl flex items-center gap-3 px-5 py-3.5 w-full max-w-lg">
            <span className="flex-1 text-sm font-medium">{selected.size} {selected.size !== 1 ? "families" : "family"} selected</span>
            <button
              onClick={removeSelected}
              disabled={acting}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {allAdmins ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
              {acting ? "..." : actionLabel}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
