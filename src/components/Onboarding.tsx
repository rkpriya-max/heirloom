"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, X } from "lucide-react";

const STORAGE_KEY = "heirloom_onboarded";

const screens = [
  {
    bg: "bg-stone-50",
    visual: "📜",
    visualBg: "bg-amber-100",
    headline: "The best recipes aren't online.",
    body: "They're in her handwriting. Spoken in the kitchen. Passed down at the dinner table. Heirloom is where they live.",
  },
  {
    bg: "bg-amber-50",
    visual: "📸",
    visualBg: "bg-white",
    headline: "Photograph it. Speak it. We'll structure it.",
    body: "Point your phone at a recipe card, record a voice note, or paste something from a message. Heirloom turns it into a recipe you can actually cook from — and keeps the original forever.",
  },
  {
    bg: "bg-stone-800",
    visual: "🏡",
    visualBg: "bg-stone-700",
    headline: "Your family's collection, always within reach.",
    body: "Everyone adds. Everyone cooks. Share your archive with family so the recipes that matter most are always at someone's fingertips.",
    dark: true,
  },
  {
    bg: "bg-amber-900",
    visual: "🍽️",
    visualBg: "bg-amber-800",
    headline: "Every recipe is an invitation.",
    body: "Plan gatherings around your archive. Build menus from recipes that matter. Bring family and community to the same table — the way food was always meant to be shared.",
    dark: true,
  },
];

interface OnboardingProps {
  onDone: () => void;
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setExiting(true);
    setTimeout(onDone, 300);
  };

  const next = () => {
    if (step < screens.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const screen = screens[step];
  const isLast = step === screens.length - 1;
  const isDark = screen.dark;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-300 ${screen.bg} ${exiting ? "opacity-0" : "opacity-100"}`}
    >
      {/* Top bar — back + skip */}
      <div className="flex justify-between items-center px-6 pt-6">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${isDark ? "text-stone-400 hover:text-stone-200" : "text-stone-400 hover:text-stone-600"}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : <div />}
        {!isLast && (
          <button
            onClick={finish}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isDark ? "text-stone-400 hover:text-stone-200" : "text-stone-400 hover:text-stone-600"}`}
          >
            <X className="w-3.5 h-3.5" /> Skip
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Visual */}
        <div
          className={`w-28 h-28 rounded-3xl flex items-center justify-center text-6xl mb-10 shadow-sm ${screen.visualBg}`}
        >
          {screen.visual}
        </div>

        {/* Headline */}
        <h1
          className={`font-serif text-3xl leading-snug mb-5 ${isDark ? "text-white" : "text-stone-800"}`}
        >
          {screen.headline}
        </h1>

        {/* Body */}
        <p
          className={`text-base leading-relaxed max-w-xs ${isDark ? "text-stone-300" : "text-stone-500"}`}
        >
          {screen.body}
        </p>
      </div>

      {/* Footer */}
      <div className="px-8 pb-12 space-y-6">
        {/* CTA button */}
        <button
          onClick={next}
          className={`w-full py-4 rounded-2xl font-medium text-base flex items-center justify-center gap-2 transition-colors ${
            isLast
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : isDark
              ? "bg-white hover:bg-stone-100 text-stone-800"
              : "bg-stone-800 hover:bg-stone-700 text-white"
          }`}
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
              className={`rounded-full transition-all duration-200 ${
                i === step
                  ? "w-5 h-2 bg-amber-500"
                  : isDark
                  ? "w-2 h-2 bg-stone-600 hover:bg-stone-500"
                  : "w-2 h-2 bg-stone-300 hover:bg-stone-400"
              }`}
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
