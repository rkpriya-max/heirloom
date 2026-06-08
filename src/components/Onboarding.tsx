"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const STORAGE_KEY = "heirloom_onboarded";

// ── Sunday's Lunch brand tokens (mirrors globals.css --sl-*) ───────────────
const C = {
  bg: "var(--sl-bg)",
  surface: "var(--sl-surface)",
  red: "var(--sl-red)",
  redDeep: "var(--sl-red-deep)",
  mustard: "var(--sl-mustard)",
  mustardSoft: "var(--sl-mustard-soft)",
  mustardWash: "var(--sl-mustard-wash)",
  ink: "var(--sl-ink)",
  inkSoft: "var(--sl-ink-soft)",
  cream: "var(--sl-cream)",
  line: "var(--sl-line)",
  lineStrong: "var(--sl-line-strong)",
  serif: "var(--font-cormorant), Georgia, serif",
  sans: "var(--font-mulish), system-ui, sans-serif",
};

// ── Brand line-icon set ────────────────────────────────────────────────────
type IconName =
  | "camera" | "mic" | "users" | "utensils" | "book"
  | "calendar" | "heart" | "arrowR" | "arrowL" | "x";

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  camera: <><path d="M4 8.5h3l1.5-2.5h7L18 8.5h2a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.2" /></>,
  mic: <><rect x="9" y="3.5" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" /><path d="M12 18v3M9 21h6" /></>,
  users: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 6.2a3 3 0 0 1 0 5.6" /><path d="M17.5 14.2c2 .6 3.5 2.3 3.5 4.8" /></>,
  utensils: <><path d="M7 4v7a2 2 0 0 0 4 0V4M9 11v9M16 4c-1.5 0-2.5 2-2.5 4.5S14.5 13 16 13v7" /></>,
  book: <><path d="M5 4.5h10a2.5 2.5 0 0 1 2.5 2.5V20H7.5A2.5 2.5 0 0 1 5 17.5V4.5Z" /><path d="M17.5 20a2.5 2.5 0 0 1 0-5" /><path d="M8.5 8.5h6M8.5 11.5h6" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2.5" /><path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4" /></>,
  heart: <path d="M12 19.5S4.5 14.8 4.5 9.5A3.8 3.8 0 0 1 12 7.6 3.8 3.8 0 0 1 19.5 9.5c0 5.3-7.5 10-7.5 10Z" />,
  arrowR: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  arrowL: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
};

function Icon({
  name, size = 22, sw = 1.7, color = "currentColor", fill = "none",
}: {
  name: IconName; size?: number; sw?: number; color?: string; fill?: string;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// ── Ladle mark + wordmark ──────────────────────────────────────────────────
function Ladle({ c = "currentColor", sw = 3.4 }: { c?: string; sw?: number }) {
  return (
    <svg viewBox="0 0 54 80" aria-hidden="true" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
      <path d="M37 6 C 25 4, 24 18, 33 19" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      <path d="M33 19 C 35 31, 31 41, 27 48" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      <path d="M10 48 A 16 16 0 0 0 42 48" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      <ellipse cx="26" cy="48" rx="16" ry="4.4" fill="none" stroke={c} strokeWidth={sw} />
    </svg>
  );
}

function OnboardingWordmark({ size = 60 }: { size?: number }) {
  const apos = (
    <span style={{ display: "inline-block", verticalAlign: "baseline", position: "relative", width: "0.42em", top: "-0.04em" }}>
      <Ladle c={C.mustardSoft} sw={3.4} />
    </span>
  );
  return (
    <div style={{ fontFamily: "var(--font-allura), cursive", color: C.cream, textAlign: "center", lineHeight: 1, fontWeight: 400, whiteSpace: "nowrap" }} aria-label="Sunday's Lunch">
      <div style={{ fontSize: size }}>Sunday{apos}s</div>
      <div style={{ fontSize: size * 0.92, marginTop: size * 0.06 }}>Lunch</div>
    </div>
  );
}

type Tone = "cover" | "paper" | "ink" | "red";

interface OnboardingItem {
  icon: IconName;
  title: string;
  text: string;
}

interface OnboardingScreen {
  tone: Tone;
  cover?: boolean;
  tagline?: string;
  icon?: IconName;
  headline?: string;
  body?: string;
  items?: OnboardingItem[];
}

const screens: OnboardingScreen[] = [
  {
    tone: "cover",
    cover: true,
    tagline: "From memory to legacy",
  },
  {
    icon: "camera",
    tone: "paper",
    headline: "Preserve any recipe.",
    body: "Photograph a handwritten card, record a voice, paste from a message, or drop a link. Sunday's Lunch structures it and keeps the original exactly as it was.",
  },
  {
    icon: "mic",
    tone: "paper",
    headline: "Capture who made it.",
    body: "Add a voice recording. Hear her describe the dish the way she always did — 'cook until it smells right.' Their words stay with the recipe, forever.",
  },
  {
    icon: "users",
    tone: "ink",
    headline: "Share with your family.",
    body: "Invite family to your archive. Everyone adds. Everyone cooks. The recipes that matter most are always within reach of the people who love them.",
  },
  {
    icon: "utensils",
    tone: "red",
    headline: "Gather around it.",
    body: "Plan dinners and events from your collection. Build menus, invite your community, and bring everyone to the same table. Every recipe is an invitation.",
  },
  {
    icon: "heart",
    tone: "paper",
    headline: "Here's how to begin.",
    body: "No rush, and no right order — start wherever feels natural. Here are the three things you can do:",
    items: [
      {
        icon: "book",
        title: "Add a recipe",
        text: "Snap a handwritten card, paste it from a text, or just talk it through. We'll tidy it into shape — you keep the original.",
      },
      {
        icon: "users",
        title: "Create a family",
        text: "Make a family and invite your loved ones. Everyone adds their own recipes, and you all share the same collection.",
      },
      {
        icon: "calendar",
        title: "Plan an event",
        text: "When it's your turn to host, pull recipes into a menu and share it round so everyone knows what's coming.",
      },
    ],
  },
];

interface ToneStyle {
  bg: string; fg: string; sub?: string; eyebrow?: string; tile?: string; tileIcon?: string; dark: boolean;
}

const TONES: Record<Tone, ToneStyle> = {
  cover: { bg: "radial-gradient(120% 90% at 50% 12%, #A12B23 0%, var(--sl-red) 45%, var(--sl-red-700) 100%)", fg: C.cream, dark: true },
  paper: { bg: C.bg, fg: C.ink, sub: C.inkSoft, eyebrow: C.red, tile: C.mustardWash, tileIcon: C.redDeep, dark: false },
  ink: { bg: C.ink, fg: C.cream, sub: "rgba(244,234,215,0.72)", eyebrow: C.mustardSoft, tile: "rgba(244,234,215,0.08)", tileIcon: C.mustardSoft, dark: true },
  red: { bg: C.redDeep, fg: C.cream, sub: "rgba(244,234,215,0.78)", eyebrow: C.mustardSoft, tile: "rgba(244,234,215,0.1)", tileIcon: C.mustardSoft, dark: true },
};

interface OnboardingProps {
  onDone: () => void;
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    const supabase = createClient();
    supabase.auth.updateUser({ data: { onboarded: true } });
    setExiting(true);
    setTimeout(onDone, 300);
  };

  const next = () => {
    if (step < screens.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const screen = screens[step];
  const t = TONES[screen.tone];
  const isLast = step === screens.length - 1;

  // ── Brand cover (logo splash) ──────────────────────────────────────────
  if (screen.cover) {
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column",
          background: t.bg, color: t.fg, fontFamily: C.sans,
          transition: "opacity .3s ease", opacity: exiting ? 0 : 1,
        }}
      >
        <div style={{ position: "absolute", inset: 20, border: "1px solid rgba(244,234,215,0.18)", borderRadius: 34, pointerEvents: "none" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 36px" }}>
          <OnboardingWordmark size={60} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 30 }}>
            <span style={{ width: 22, height: 1, background: "rgba(244,234,215,0.4)", flexShrink: 0 }} />
            <span style={{ fontFamily: C.serif, textTransform: "uppercase", letterSpacing: "0.2em", fontSize: 10.5, paddingLeft: "0.2em", whiteSpace: "nowrap" }}>{screen.tagline}</span>
            <span style={{ width: 22, height: 1, background: "rgba(244,234,215,0.4)", flexShrink: 0 }} />
          </div>
        </div>
        <div style={{ padding: "0 28px max(env(safe-area-inset-bottom), 44px)" }}>
          <button
            onClick={next}
            style={{
              width: "100%", padding: 16, borderRadius: 16, fontFamily: C.sans, fontWeight: 800, fontSize: 15.5,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9, border: "none", cursor: "pointer",
              background: C.cream, color: C.redDeep,
            }}
          >
            Begin <Icon name="arrowR" size={18} sw={2.2} color={C.redDeep} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column",
        background: t.bg, color: t.fg, fontFamily: C.sans,
        transition: "opacity .3s ease", opacity: exiting ? 0 : 1,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "max(env(safe-area-inset-top), 24px) 26px 0",
        }}
      >
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 700, color: t.sub, background: "none", border: "none", cursor: "pointer", fontFamily: C.sans }}
          >
            <Icon name="arrowL" size={15} sw={2.2} color={t.sub} /> Back
          </button>
        ) : (
          <span />
        )}
        {!isLast && (
          <button
            onClick={finish}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: t.sub, background: "none", border: "none", cursor: "pointer", fontFamily: C.sans }}
          >
            <Icon name="x" size={14} sw={2.2} color={t.sub} /> Skip
          </button>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "24px 34px", textAlign: "center", overflowY: "auto",
        }}
      >
        {/* Icon tile */}
        <div
          style={{
            width: 92, height: 92, borderRadius: 26, background: t.tile,
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 30,
          }}
        >
          <Icon name={screen.icon!} size={42} sw={1.6} color={t.tileIcon} fill={screen.icon === "heart" ? t.tileIcon : "none"} />
        </div>

        {/* Step label */}
        <p style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: t.eyebrow, margin: "0 0 14px" }}>
          Step {step} of {screens.length - 1}
        </p>

        {/* Headline */}
        <h1 style={{ fontFamily: C.serif, fontSize: 40, lineHeight: 1.08, fontWeight: 600, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          {screen.headline}
        </h1>

        {/* Body */}
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: t.sub, maxWidth: "30ch", margin: 0 }}>
          {screen.body}
        </p>

        {/* Instructional cards (last screen) */}
        {screen.items && (
          <div style={{ marginTop: 26, width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 11, textAlign: "left" }}>
            {screen.items.map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 13, background: C.surface,
                  border: `1px solid ${C.line}`, borderRadius: 18, padding: "14px 16px",
                  boxShadow: "0 6px 20px -14px rgba(42,28,21,0.3)",
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.mustardWash, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={item.icon} size={19} sw={1.7} color={C.redDeep} />
                </div>
                <div>
                  <p style={{ fontFamily: C.serif, margin: 0, fontSize: 19, fontWeight: 600, color: C.ink, lineHeight: 1.15 }}>{item.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 13, color: C.inkSoft, lineHeight: 1.45 }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "0 28px max(env(safe-area-inset-bottom), 36px)", display: "flex", flexDirection: "column", gap: 22 }}>
        <button
          onClick={next}
          style={{
            width: "100%", padding: 16, borderRadius: 16, fontFamily: C.sans, fontWeight: 800,
            fontSize: 15.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            border: "none", cursor: "pointer",
            background: isLast ? C.mustard : t.dark ? C.cream : C.red,
            color: isLast ? "#3a2606" : t.dark ? C.redDeep : C.cream,
          }}
        >
          {isLast ? "Start preserving" : "Next"}
          <Icon name="arrowR" size={18} sw={2.2} color={isLast ? "#3a2606" : t.dark ? C.redDeep : C.cream} />
        </button>

        {/* Progress dots */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {screens.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              style={{
                height: 7, width: i === step ? 22 : 7, borderRadius: 999, border: "none",
                padding: 0, cursor: "pointer", transition: "all .2s",
                background: i === step ? C.mustard : t.dark ? "rgba(244,234,215,0.3)" : C.lineStrong,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, []);

  return {
    show,
    dismiss: () => setShow(false),
  };
}
