"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Wordmark } from "@/components/Wordmark";

const STORAGE_KEY = "heirloom_onboarded";

const screens = [
  {
    visual: "📸",
    step: "Step 1",
    headline: "Preserve any recipe.",
    body: "Photograph a handwritten card, record a voice, paste from a message, or drop a link. Sunday's Lunch structures it and keeps the original exactly as it was.",
  },
  {
    visual: "🎙️",
    step: "Step 2",
    headline: "Capture who made it.",
    body: "Add a voice recording. Hear her describe the dish the way she always did — 'cook until it smells right.' Their words stay with the recipe, forever.",
  },
  {
    visual: "🏡",
    step: "Step 3",
    headline: "Share with your family.",
    body: "Invite family to your archive. Everyone adds. Everyone cooks. The recipes that matter most are always within reach of the people who love them.",
  },
  {
    visual: "🍽️",
    step: "Step 4",
    headline: "Gather around it.",
    body: "Plan dinners and events from your collection. Build menus, invite your community, and bring everyone to the same table. Every recipe is an invitation.",
  },
];

interface OnboardingProps {
  onDone: () => void;
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);

  const markDone = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    const supabase = createClient();
    supabase.auth.updateUser({ data: { onboarded: true } });
  };

  const skip = () => {
    markDone();
    onDone();
  };

  const next = () => {
    if (step < screens.length - 1) {
      setStep((s) => s + 1);
    } else {
      markDone();
      setComplete(true);
    }
  };

  // Completion screen — user explicitly taps to go to the app
  if (complete) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center"
        style={{ background: "var(--bg)" }}
      >
        <Wordmark size={52} strokeWidth={3.8} className="mb-10" />

        <h2
          className="font-serif text-3xl font-semibold leading-snug mb-4"
          style={{ color: "var(--ink)" }}
        >
          Your kitchen, preserved.
        </h2>
        <p
          className="text-base leading-relaxed max-w-xs mb-12"
          style={{ color: "var(--ink-soft)" }}
        >
          Every recipe, every memory, every voice — kept safe for the people
          who come after you.
        </p>

        <button
          onClick={onDone}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{
            background: "var(--red)",
            color: "#FFFDF8",
            boxShadow: "0 8px 18px -8px rgba(122,27,26,0.8)",
          }}
        >
          Go to Sunday&apos;s Lunch <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const screen = screens[step];
  const isLast = step === screens.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 pt-6">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--ink-faint)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={skip}
          className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--ink-faint)" }}
        >
          <X className="w-3.5 h-3.5" /> Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Visual */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-8 shadow-sm"
          style={{ background: "var(--mustard-wash)" }}
        >
          {screen.visual}
        </div>

        {/* Step label */}
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.22em] mb-3"
          style={{ color: "var(--mustard)" }}
        >
          {screen.step} of {screens.length}
        </p>

        {/* Headline */}
        <h1
          className="font-serif text-3xl font-semibold leading-snug mb-4"
          style={{ color: "var(--ink)" }}
        >
          {screen.headline}
        </h1>

        {/* Body */}
        <p
          className="text-base leading-relaxed max-w-xs"
          style={{ color: "var(--ink-soft)" }}
        >
          {screen.body}
        </p>
      </div>

      {/* Footer */}
      <div className="px-8 pb-12 space-y-6">
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{
            background: "var(--red)",
            color: "#FFFDF8",
            boxShadow: "0 8px 18px -8px rgba(122,27,26,0.7)",
          }}
        >
          {isLast ? "Start preserving" : "Next"}
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {screens.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all duration-200"
              style={
                i === step
                  ? { width: 20, height: 8, background: "var(--mustard)" }
                  : { width: 8, height: 8, background: "var(--line)" }
              }
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
