"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const C = {
  bg: "var(--sl-bg)",
  surface: "var(--sl-surface)",
  red: "var(--sl-red)",
  redDeep: "var(--sl-red-deep)",
  mustard: "var(--sl-mustard)",
  mustardWash: "var(--sl-mustard-wash)",
  ink: "var(--sl-ink)",
  inkSoft: "var(--sl-ink-soft)",
  inkFaint: "var(--sl-ink-faint)",
  cream: "var(--sl-cream)",
  line: "var(--sl-line)",
  lineStrong: "var(--sl-line-strong)",
  serif: "var(--font-cormorant), Georgia, serif",
  sans: "var(--font-mulish), system-ui, sans-serif",
};

const CATEGORIES = ["A bug", "An idea", "Recipes & scanning", "Sharing & family", "Something else"];

function Heart({ value, filled, onClick, onEnter, onLeave }: {
  value: number; filled: boolean; onClick: () => void; onEnter: () => void; onLeave: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-label={`Rate ${value} out of 5`}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
    >
      <svg width={38} height={38} viewBox="0 0 24 24" fill={filled ? C.red : C.lineStrong} style={{ transition: "fill .15s" }} aria-hidden="true">
        <path d="M12 19.5S4.5 14.8 4.5 9.5A3.8 3.8 0 0 1 12 7.6 3.8 3.8 0 0 1 19.5 9.5c0 5.3-7.5 10-7.5 10Z" />
      </svg>
    </button>
  );
}

export default function FeedbackPage() {
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = rating > 0 || message.trim().length > 0;

  const submit = async () => {
    if (!canSend || sending) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("feedback").insert({
        user_id: user?.id ?? null,
        rating: rating || null,
        category,
        message: message.trim() || null,
      });
    } catch {
      // Swallow errors — never block the user on a feedback send.
    } finally {
      setSending(false);
      setSent(true);
    }
  };

  const reset = () => {
    setRating(0); setHover(0); setCategory(null); setMessage(""); setSent(false);
  };

  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: C.red, margin: "0 0 14px" };
  const section: React.CSSProperties = { marginBottom: 28 };

  if (sent) {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, color: C.ink, fontFamily: C.sans, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 40px" }}>
        <div style={{ width: 96, height: 96, borderRadius: 28, background: C.mustardWash, display: "flex", alignItems: "center", justifyContent: "center", color: C.redDeep, marginBottom: 28 }}>
          <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5 10 17.5 19 7" />
          </svg>
        </div>
        <h2 style={{ fontFamily: C.serif, fontSize: 34, fontWeight: 600, margin: "0 0 12px", lineHeight: 1.1 }}>Straight to the kitchen.</h2>
        <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.55, margin: "0 0 30px", maxWidth: "26ch" }}>
          Thank you — every note helps us make Sunday&apos;s Lunch a little warmer.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => router.back()} style={{ padding: "14px 26px", borderRadius: 14, background: C.ink, color: C.cream, fontWeight: 800, fontSize: 14.5, border: "none", cursor: "pointer", fontFamily: C.sans }}>
            Done
          </button>
          <button onClick={reset} style={{ padding: "14px 26px", borderRadius: 14, background: "transparent", color: C.inkSoft, fontWeight: 800, fontSize: 14.5, border: `1px solid ${C.line}`, cursor: "pointer", fontFamily: C.sans }}>
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.ink, fontFamily: C.sans }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(env(safe-area-inset-top), 20px) 22px 8px" }}>
        <button onClick={() => router.back()} aria-label="Back" style={{ width: 38, height: 38, borderRadius: "50%", background: C.surface, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkSoft, cursor: "pointer" }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m14.5 6-6 6 6 6" />
          </svg>
        </button>
        <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: C.inkFaint }}>Feedback</span>
      </div>

      <div style={{ padding: "8px 26px max(env(safe-area-inset-bottom) + 100px, 110px)", maxWidth: 520, margin: "0 auto" }}>
        {/* Ladle mark */}
        <svg viewBox="0 0 54 80" width={40} style={{ color: C.red, marginBottom: 16 }} aria-hidden="true">
          <path d="M37 6 C 25 4, 24 18, 33 19" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" />
          <path d="M33 19 C 35 31, 31 41, 27 48" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" />
          <path d="M10 48 A 16 16 0 0 0 42 48" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" />
          <ellipse cx="26" cy="48" rx="16" ry="4.4" fill="none" stroke="currentColor" strokeWidth={3.4} />
        </svg>

        <h1 style={{ fontFamily: C.serif, fontSize: 34, lineHeight: 1.12, fontWeight: 600, margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          How did we cook?
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: C.inkSoft, margin: "0 0 28px", maxWidth: "32ch" }}>
          Your honest take shapes what Sunday&apos;s Lunch becomes. Tell us what&apos;s working, what isn&apos;t, and what you wish it did.
        </p>

        {/* Rating */}
        <div style={section}>
          <p style={label}>How&apos;s it tasting so far?</p>
          <div style={{ display: "flex", gap: 10 }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Heart
                key={v}
                value={v}
                filled={v <= (hover || rating)}
                onClick={() => setRating(v)}
                onEnter={() => setHover(v)}
                onLeave={() => setHover(0)}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11.5, fontWeight: 600, color: C.inkFaint }}>
            <span>Needs work</span><span>Chef&apos;s kiss</span>
          </div>
        </div>

        {/* Category */}
        <div style={section}>
          <p style={label}>What&apos;s this about?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {CATEGORIES.map((c) => {
              const on = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(on ? null : c)}
                  style={{
                    padding: "9px 15px", borderRadius: 999, fontSize: 13, fontWeight: 700, fontFamily: C.sans,
                    whiteSpace: "nowrap", cursor: "pointer", transition: "all .16s",
                    background: on ? C.red : C.surface,
                    color: on ? C.cream : C.inkSoft,
                    border: "none",
                    boxShadow: on ? "none" : `inset 0 0 0 1px ${C.line}`,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div style={section}>
          <p style={label}>Tell us more</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="The more detail, the better we can cook. What happened, what you expected, what you'd love to see…"
            style={{ width: "100%", minHeight: 180, lineHeight: 1.55, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px 16px", fontFamily: C.sans, fontSize: 14.5, color: C.ink, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            onFocus={(e) => (e.target.style.borderColor = C.mustard)}
            onBlur={(e) => (e.target.style.borderColor = C.line)}
          />
        </div>

        <button
          onClick={submit}
          disabled={!canSend || sending}
          style={{
            width: "100%", padding: 16, borderRadius: 16, background: C.red, color: C.cream, fontFamily: C.sans,
            fontWeight: 800, fontSize: 15.5, border: "none", cursor: canSend && !sending ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            opacity: !canSend || sending ? 0.45 : 1, transition: "opacity .2s",
          }}
        >
          {sending ? "Sending…" : "Send feedback"}
          {!sending && (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12 19 5l-4 14-3.5-5L5 12Z" />
            </svg>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 14, fontSize: 11.5, color: C.inkFaint }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5.5" y="10.5" width="13" height="9" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
          </svg>
          Private — only the Sunday&apos;s Lunch team sees this
        </div>
      </div>
    </div>
  );
}
