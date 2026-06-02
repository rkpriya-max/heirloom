"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [next, setNext] = useState("/home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("next");
    if (n) setNext(n);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetSent(true);
    setResetLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push(next);
      router.refresh();
    }
  };

  if (resetMode) {
    return (
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-stone-800 mb-2">Reset password</h1>
          <p className="text-stone-400 text-sm">We&apos;ll send you a link to sign back in.</p>
        </div>
        {resetSent ? (
          <div className="text-center py-4">
            <p className="text-stone-700 font-medium mb-2">Check your email</p>
            <p className="text-stone-400 text-sm mb-6">A reset link was sent to <strong>{email}</strong>. Click it to sign in.</p>
            <button onClick={() => { setResetMode(false); setResetSent(false); }} className="text-amber-600 text-sm font-medium">
              ← Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com" required
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <button type="submit" disabled={resetLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {resetLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send reset link"}
            </button>
            <button type="button" onClick={() => setResetMode(false)} className="w-full text-stone-400 text-sm py-2">
              ← Back to sign in
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-stone-800 mb-2">Heirloom</h1>
        <p className="text-stone-400 text-sm">Welcome back</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="Your password"
            required
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign in"}
        </button>
      </form>

      <div className="flex items-center justify-between mt-4">
        <p className="text-stone-400 text-sm">
          No account?{" "}
          <Link href={`/signup${next !== "/home" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-amber-600 font-medium">
            Create one
          </Link>
        </p>
        <button onClick={() => setResetMode(true)} className="text-stone-400 text-xs hover:text-stone-600">
          Forgot password?
        </button>
      </div>
    </div>
  );
}
