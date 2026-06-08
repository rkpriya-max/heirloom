"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Mic, Square } from "lucide-react";
import BottomNav from "@/components/BottomNav";

type Tab = "photo" | "link" | "text" | "voice";

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: "photo", emoji: "📸", label: "Photo" },
  { id: "link",  emoji: "🔗", label: "Link"  },
  { id: "text",  emoji: "✏️", label: "Text"  },
  { id: "voice", emoji: "🎙️", label: "Voice" },
];

export default function UploadPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("photo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Photo state
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  // Link state
  const [url, setUrl] = useState("");

  // Text state
  const [pastedText, setPastedText] = useState("");

  // Voice state
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
  }, []);

  const toggleRecording = async () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError("Voice recording isn't supported in this browser. Try Chrome on Android or desktop.");
      return;
    }

    if (recording) {
      recognition.stop();
      mediaRecorderRef.current?.stop();
      setRecording(false);
    } else {
      setTranscript("");
      setError(null);
      sessionStorage.removeItem("heirloom_voice_audio");
      sessionStorage.removeItem("heirloom_voice_type");

      let finalText = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t + " ";
          else interim = t;
        }
        setTranscript(finalText + interim);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        setRecording(false);
        if (e.error === "not-allowed") {
          setError("Microphone access was denied. Allow it in your browser settings and try again.");
        } else if (e.error === "no-speech") {
          setError("Nothing heard — tap record and speak clearly.");
        } else {
          setError(`Recording failed (${e.error}). Try Chrome on Android or desktop.`);
        }
      };

      recognition.onend = () => setRecording(false);

      // Capture raw audio in parallel with speech recognition
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            sessionStorage.setItem("heirloom_voice_audio", base64);
            sessionStorage.setItem("heirloom_voice_type", mimeType);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach((t) => t.stop());
        };
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
      } catch {
        // Audio capture failed — transcript still works, just no raw recording saved
      }

      try {
        recognition.start();
        setRecording(true);
      } catch {
        setError("Could not start recording. Try Chrome on Android or desktop.");
      }
    }
  };

  // ── Photo helpers ──
  const compressImage = (f: File): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], "recipe.jpg", { type: "image/jpeg" }) : f),
          "image/jpeg", 0.75
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(f); };
      img.src = url;
    });

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    setFile(f); setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  // ── Submit ──
  const canSubmit = () => {
    if (tab === "photo") return !!file;
    if (tab === "link") return url.trim().length > 10;
    if (tab === "text") return pastedText.trim().length > 20;
    if (tab === "voice") return transcript.trim().length > 20;
    return false;
  };

  const handleDigitize = async () => {
    setLoading(true); setError(null);

    try {
      if (tab === "photo") {
        const compressed = await compressImage(file!);
        const formData = new FormData();
        formData.append("image", compressed);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const res = await fetch("/api/digitize", { method: "POST", body: formData, signal: controller.signal });
        clearTimeout(timeout);

        const data = await res.json();
        if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }

        sessionStorage.setItem("heirloom_recipes", JSON.stringify(data.recipes));
        sessionStorage.setItem("heirloom_image", data.imageBase64);
        sessionStorage.setItem("heirloom_media_type", data.mediaType);

      } else {
        const body = tab === "link"
          ? { url: url.trim() }
          : { text: tab === "voice" ? transcript : pastedText };

        const res = await fetch("/api/digitize-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.paywall) {
            // Paywalled site — switch to text tab automatically and pre-fill hint
            setError(data.error);
            setTab("text");
            setPastedText("");
          } else {
            setError(data.error || "Something went wrong.");
          }
          setLoading(false);
          return;
        }

        sessionStorage.setItem("heirloom_recipes", JSON.stringify(data.recipes));
        sessionStorage.removeItem("heirloom_image");
        sessionStorage.removeItem("heirloom_media_type");
      }

      router.push("/review");
    } catch (err) {
      const msg = err instanceof Error && err.name === "AbortError"
        ? "Took too long — try a clearer photo with better lighting."
        : "Failed to connect. Check your internet and try again.";
      setError(msg);
      setLoading(false);
    }
  };

  const buttonLabel = () => {
    if (tab === "photo") return "Digitize this recipe";
    if (tab === "link") return "Extract from link";
    if (tab === "text") return "Structure this recipe";
    if (tab === "voice") return "Structure this recipe";
  };

  return (
    <><main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 pb-24">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <a href="/home" className="text-3xl font-serif text-stone-800 mb-2 block hover:text-amber-700 transition-colors">Sunday&apos;s Lunch</a>
          <p className="text-stone-500 text-sm">Add a recipe to your archive</p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-6 bg-stone-100 p-1 rounded-2xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(null); }}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-0.5
                ${tab === t.id ? "bg-white text-stone-800 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}
            >
              <span className="text-base">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Photo tab */}
        {tab === "photo" && (
          <div
            className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer
              ${dragging ? "border-amber-400 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"}
              ${preview ? "border-solid border-stone-200" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input id="file-input" type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Recipe preview" className="w-full rounded-2xl object-contain max-h-96" />
                <button
                  className="absolute top-3 right-3 bg-white/90 text-stone-600 text-xs px-3 py-1 rounded-full shadow"
                  onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
                >
                  Replace
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="bg-stone-100 rounded-full p-4 mb-4">
                  <Upload className="w-6 h-6 text-stone-400" />
                </div>
                <p className="text-stone-600 font-medium mb-1">
                  {isTouch ? "Tap to take a photo" : "Drop a photo here"}
                </p>
                <p className="text-stone-400 text-sm">
                  {isTouch ? "or choose from your library" : "or click to browse files"}
                </p>
                <p className="text-stone-300 text-xs mt-3">JPG, PNG, WebP up to 10MB</p>
              </div>
            )}
          </div>
        )}

        {/* Link tab */}
        {tab === "link" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <p className="text-stone-500 text-sm mb-4">Paste a link from any recipe website and we&apos;ll pull the recipe out.</p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.anyrecipesite.com/recipe/..."
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {/* Text tab */}
        {tab === "text" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <p className="text-stone-500 text-sm mb-4">Paste a recipe from WhatsApp, iMessage, email — anywhere.</p>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the recipe here..."
              rows={10}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>
        )}

        {/* Voice tab */}
        {tab === "voice" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            {!supported ? (
              <div className="text-center py-6">
                <p className="text-stone-500 text-sm">Voice recording isn&apos;t supported in this browser.</p>
                <p className="text-stone-400 text-xs mt-2">Try Chrome on desktop or Android.</p>
              </div>
            ) : (
              <>
                <p className="text-stone-500 text-sm mb-4">
                  Press record and speak the recipe — the way she always told it. Quantities, method, tips and all.
                </p>
                <button
                  onClick={toggleRecording}
                  className={`w-full py-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors mb-4
                    ${recording
                      ? "bg-red-50 border-2 border-red-300 text-red-600"
                      : "bg-amber-50 border-2 border-amber-200 text-amber-700 hover:bg-amber-100"}`}
                >
                  {recording
                    ? <><Square className="w-4 h-4 fill-red-500 text-red-500" /> Stop recording</>
                    : <><Mic className="w-4 h-4" /> Start recording</>}
                </button>
                {recording && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-500 text-xs font-medium">Recording...</span>
                  </div>
                )}
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your words will appear here as you speak. Edit anything before saving."
                  rows={8}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-amber-400 resize-none"
                />
                {transcript && (
                  <button onClick={() => setTranscript("")} className="text-xs text-stone-300 hover:text-stone-500 mt-2">
                    Clear
                  </button>
                )}
              </>
            )}
            </div>
        )}

        {/* Error */}
        {error && <p className="mt-3 text-red-600 text-sm text-center">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleDigitize}
          disabled={!canSubmit() || loading}
          className={`w-full mt-5 py-4 rounded-xl font-medium text-sm transition-all
            ${canSubmit() && !loading
              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              : "bg-stone-200 text-stone-400 cursor-not-allowed"}`}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Reading recipe...</span>
            : buttonLabel()}
        </button>

        {loading && (
          <p className="text-center text-stone-400 text-xs mt-3">
            {tab === "photo" ? "Reading the handwriting. This takes 10–20 seconds." : "Extracting the recipe. Just a moment."}
          </p>
        )}
      </div>
    </main><BottomNav /></>
  );
}
