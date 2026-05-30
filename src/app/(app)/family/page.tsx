"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function FamilyLandingPage() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Check if this user is already in a family
      const { data } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data?.family_id) {
        router.replace(`/family/${data.family_id}`);
      }
      // Otherwise render the "create family" UI below
    };
    check();
  }, [router]);

  return (
    <main className="max-w-lg mx-auto px-4 pt-16 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
        <Users className="w-9 h-9 text-amber-600" />
      </div>

      <h1 className="text-2xl font-serif text-stone-800 mb-2">Your family archive</h1>
      <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-xs">
        Create a family to share recipes, add memories, and build an archive across generations.
      </p>

      <Link href="/family/new"
        className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3.5 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors">
        <Plus className="w-4 h-4" /> Create a family
      </Link>

      <p className="text-stone-300 text-xs mt-6">
        Invited to a family? The link in your email will add you automatically.
      </p>
    </main>
  );
}
