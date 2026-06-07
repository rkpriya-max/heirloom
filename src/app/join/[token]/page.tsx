"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface InviteData {
  id: string;
  family_id: string;
  invited_email: string | null;
  accepted: boolean;
  family_name: string;
  family_description: string | null;
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      // Use RPC to get invite + family name (bypasses RLS for unauthenticated users)
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc("get_invite_details", { p_token: token })
        .single();
      const data = rpcData as InviteData | null;

      if (rpcErr || !data) {
        setError("This invite link is invalid or has expired.");
        setLoading(false);
        return;
      }

      if (data.accepted) {
        setError("This invite has already been accepted.");
        setLoading(false);
        return;
      }

      setInvite({
        id: data.id,
        family_id: data.family_id,
        invited_email: data.invited_email ?? null,
        accepted: data.accepted,
        family_name: data.family_name ?? "a family",
        family_description: data.family_description ?? null,
      });

      setLoading(false);
    };
    load();
  }, [token]);

  const handleJoin = async () => {
    if (!invite || !userId) return;
    setJoining(true);
    setJoinError("");

    const supabase = createClient();

    // Check if already a member
    const { data: existing } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("family_id", invite.family_id)
      .eq("user_id", userId)
      .single();

    if (!existing) {
      const { error: insertErr } = await supabase.from("family_members").insert({
        family_id: invite.family_id,
        user_id: userId,
        role: "member",
      });

      if (insertErr) {
        setJoinError("Could not join family. " + insertErr.message);
        setJoining(false);
        return;
      }
    }

    // Mark invite accepted
    await supabase
      .from("family_invites")
      .update({ accepted: true })
      .eq("id", invite.id);

    setDone(true);
    const familyUrl = `/family/${invite.family_id}`;
    const onboarded = localStorage.getItem("heirloom_onboarded");
    if (!onboarded) {
      // New user — show onboarding first, then take them to the family
      localStorage.setItem("heirloom_post_onboard", familyUrl);
      setTimeout(() => router.push("/home"), 1500);
    } else {
      setTimeout(() => router.push(familyUrl), 1500);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
      </main>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-serif text-stone-800 mb-2">Invalid invite</h1>
        <p className="text-stone-400 text-sm mb-6">{error}</p>
        <Link href="/home" className="text-amber-600 text-sm font-medium">Go to Sunday&apos;s Lunch →</Link>
      </main>
    );
  }

  // ── Success ──
  if (done) {
    return (
      <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
        <h1 className="text-xl font-serif text-stone-800 mb-2">You joined {invite?.family_name}</h1>
        <p className="text-stone-400 text-sm">Taking you to the family archive...</p>
      </main>
    );
  }

  // ── Main ──
  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <Users className="w-9 h-9 text-amber-600" />
        </div>

        <h1 className="text-3xl font-serif text-stone-800 mb-1">Sunday&apos;s Lunch</h1>
        <p className="text-stone-400 text-sm mb-8">You&apos;ve been invited to join</p>

        <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6 text-left">
          <h2 className="text-xl font-serif text-stone-800 mb-1">{invite?.family_name}</h2>
          {invite?.family_description && (
            <p className="text-stone-400 text-sm">{invite.family_description}</p>
          )}
        </div>

        {userId ? (
          // Logged in — show join button
          <>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {joining
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
                : `Join ${invite?.family_name}`}
            </button>
            {joinError && <p className="text-red-500 text-sm mt-3">{joinError}</p>}
          </>
        ) : (
          // Not logged in — show auth options
          <div className="space-y-3">
            <p className="text-stone-500 text-sm mb-4">
              Create an account or sign in to join.
            </p>
            <Link
              href={`/signup?next=${encodeURIComponent(`/join/${token}`)}`}
              className="block w-full bg-amber-600 text-white py-4 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors"
            >
              Create an account
            </Link>
            <Link
              href={`/login?next=${encodeURIComponent(`/join/${token}`)}`}
              className="block w-full bg-white text-stone-800 border border-stone-200 py-4 rounded-xl font-medium text-sm hover:bg-stone-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
