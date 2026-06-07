"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Wordmark } from "@/components/Wordmark";

export default function SignupPage() {
  const router = useRouter();
  const [next, setNext] = useState("/home");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("next");
    if (n) setNext(n);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // session is null → Supabase sent a confirmation email
    if (!data.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    // session exists → no confirmation needed, go straight in
    router.push(next);
    router.refresh();
  };

  // ── Check your email screen ──
  if (checkEmail) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-serif text-stone-800 mb-2">Check your email</h1>
        <p className="text-stone-400 text-sm leading-relaxed mb-2">
          We sent a confirmation link to
        </p>
        <p className="text-stone-700 font-medium text-sm mb-6">{email}</p>
        <p className="text-stone-400 text-xs leading-relaxed mb-8">
          Click the link in that email to activate your account. Then come back and sign in.
        </p>
        <Link
          href={`/login${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="block w-full bg-amber-600 text-white py-3.5 rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors"
        >
          Go to sign in
        </Link>
        <p className="text-stone-300 text-xs mt-4">
          Didn&apos;t get it? Check your spam folder.
        </p>
      </div>
    );
  }

  // ── Signup form ──
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Wordmark size={48} strokeWidth={3.8} className="mb-3" />
        <h1 className="text-2xl font-serif text-stone-800 mb-3 mt-2">That recipe your mum made is sitting in a dusty notebook.</h1>
        <p className="text-stone-400 text-sm leading-relaxed">Sunday&apos;s Lunch keeps it alive for generations to come.</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5 block">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ characters"
            minLength={8}
            required
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create account"}
        </button>
      </form>

      <p className="text-center text-stone-400 text-sm mt-6">
        Already have an account?{" "}
        <Link href={`/login${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-amber-600 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
