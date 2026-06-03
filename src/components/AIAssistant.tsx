"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Loader2, Sparkles, CheckCircle, Mic, Square, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { safeStr, textToIngredients, textToSteps, detectRecipeIntent } from "@/lib/recipe-utils";

// ── Types ────────────────────────────────────────────────────────────────────

type ChatState = "chatting" | "adding" | "recording" | "extracting" | "confirming" | "saving" | "memory1" | "memory2" | "complete";

interface RecipeCard {
  title: string;
  ingredientCount: number;
  stepCount: number;
  cookTime: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "recipe_card" | "input_picker";
  recipeCard?: RecipeCard;
}

interface AIAssistantProps { defaultOpen?: boolean }

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOpener(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "Which dish takes you somewhere good the moment you think of it?";
  if (h >= 12 && h < 17) return "What dish do you want the next generation to know?";
  if (h >= 17 && h < 22) return "What's a family recipe that should never be forgotten?";
  return "Tell me about a dish that means something to you.";
}

const CHIPS = [
  "What can I cook tonight?",
  "Search my recipes",
  "Add a recipe",
  "Help me plan a menu",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIAssistant({ defaultOpen = false }: AIAssistantProps) {
  const [open, setOpen] = useState(defaultOpen);
  const pathname = usePathname();
  const isHome = pathname === "/home";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipeContext, setRecipeContext] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [opener] = useState(getOpener);

  // Recipe add flow
  const [chatState, setChatState] = useState<ChatState>("chatting");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingRecipe, setPendingRecipe] = useState<any>(null);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [savedRecipeTitle, setSavedRecipeTitle] = useState("");
  const [showFollowUpChips, setShowFollowUpChips] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Load user + recipe context
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("recipes").select("title").eq("user_id", user.id).limit(50);
      setRecipeContext((data ?? []).map((r: { title: string }) => r.title));
    };
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // ── Photo scan in chat ─────────────────────────────────────────────────────

  const handlePhotoScan = async (file: File) => {
    addMessage("user", "📸 Photo uploaded");
    setLoading(true);
    addMessage("assistant", "Reading the recipe from your photo...");
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      const compressed = await new Promise<File>((resolve) => {
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 1200;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob ? new File([blob], "recipe.jpg", { type: "image/jpeg" }) : file), "image/jpeg", 0.82);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
      });
      const formData = new FormData();
      formData.append("image", compressed);
      const res = await fetch("/api/digitize", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => [...prev.slice(0, -1)]);
        addMessage("assistant", data.error);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipe = Array.isArray(data.recipes) ? data.recipes[0] : data.recipes as any;
        const stepsArr = Array.isArray(recipe?.steps?.value) ? recipe.steps.value : [];
        const ingsArr = Array.isArray(recipe?.ingredients?.value) ? recipe.ingredients.value : [];
        const ingredientCount = ingsArr.reduce((n: number, g: { items?: string[] }) => n + (Array.isArray(g.items) ? g.items.length : 0), 0);
        const card: RecipeCard = {
          title: safeStr(recipe?.title?.value) || "Recipe",
          ingredientCount, stepCount: stepsArr.length,
          cookTime: safeStr(recipe?.cook_time?.value) || null, raw: recipe,
        };
        setPendingRecipe(recipe);
        setChatState("confirming");
        setMessages((prev) => [...prev.slice(0, -1), {
          role: "assistant", content: "Here's what I found in the photo:",
          type: "recipe_card", recipeCard: card,
        }]);
      }
    } catch {
      setMessages((prev) => [...prev.slice(0, -1)]);
      addMessage("assistant", "Couldn't read that photo. Try again or type the recipe instead.");
    }
    setLoading(false);
  };

  // ── Voice recording in chat ────────────────────────────────────────────────

  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { addMessage("assistant", "Voice isn't supported in this browser. Try Chrome on Android or paste the recipe text."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    let final = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim = e.results[i][0].transcript;
      }
      setTranscript(final + interim);
    };
    rec.onend = () => { setIsRecording(false); if (final.trim()) send(final.trim()); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => { setIsRecording(false); addMessage("assistant", `Mic error: ${e.error}. Try typing instead.`); };
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    setTranscript("");
    setChatState("recording");
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setIsRecording(false); setChatState("chatting"); };

  // ── Save recipe to Supabase ────────────────────────────────────────────────

  const handleSaveRecipe = async () => {
    if (!pendingRecipe || !userId) return;
    setChatState("saving");
    const supabase = createClient();

    const stepsVal = pendingRecipe.steps?.value;
    const stepsText = Array.isArray(stepsVal)
      ? stepsVal.map((s: unknown, i: number) => `${i + 1}. ${safeStr(s)}`).join("\n")
      : safeStr(stepsVal);

    const ingredientsVal = pendingRecipe.ingredients?.value;
    const ingredientsText = Array.isArray(ingredientsVal)
      ? ingredientsVal.map((g: { section?: string; items: string[] }) => {
          const items = Array.isArray(g.items) ? g.items.join("\n") : "";
          return g.section ? `## ${g.section}\n${items}` : items;
        }).join("\n\n")
      : safeStr(ingredientsVal);

    const title = safeStr(pendingRecipe.title?.value) || "Untitled recipe";

    const { data: recipe, error } = await supabase
      .from("recipes")
      .insert({
        user_id: userId,
        title,
        yield: safeStr(pendingRecipe.yield?.value) || null,
        cook_time: safeStr(pendingRecipe.cook_time?.value) || null,
        notes: safeStr(pendingRecipe.notes?.value) || null,
      })
      .select("id").single();

    if (error || !recipe) {
      setChatState("confirming");
      addMessage("assistant", "Couldn't save that — try again.");
      return;
    }

    const recipeId = recipe.id;
    const ops = [];

    const ingredientGroups = textToIngredients(ingredientsText);
    if (ingredientGroups.length > 0) {
      ops.push(...ingredientGroups.map((group, i) =>
        supabase.from("recipe_ingredients").insert({
          recipe_id: recipeId, section: group.section || null, items: group.items, sort_order: i,
        })
      ));
    }

    const steps = textToSteps(stepsText);
    if (steps.length > 0) {
      ops.push(...steps.map((content, i) =>
        supabase.from("recipe_steps").insert({ recipe_id: recipeId, content, sort_order: i })
      ));
    }

    await Promise.all(ops);

    setSavedRecipeId(recipeId);
    setSavedRecipeTitle(title);
    setRecipeContext((prev) => [title, ...prev]);
    setChatState("memory1");

    addMessage("assistant",
      `${title} is saved. Is there a memory, a person, or a gathering connected to this one?`
    );
  };

  // ── Save a memory ──────────────────────────────────────────────────────────

  const saveMemory = async (content: string) => {
    if (!savedRecipeId || !userId || !content.trim()) return;
    const supabase = createClient();
    await supabase.from("recipe_memories").insert({
      recipe_id: savedRecipeId,
      user_id: userId,
      content: content.trim(),
      tagged_people: [],
    });
  };

  // ── Add message helper ─────────────────────────────────────────────────────

  const addMessage = (role: "user" | "assistant", content: string, extra?: Partial<ChatMessage>) =>
    setMessages((prev) => [...prev, { role, content, type: "text", ...extra }]);

  // ── Main send handler ──────────────────────────────────────────────────────

  const send = async (text: string) => {
    if (!text.trim() || loading || chatState === "saving") return;
    setInput("");

    // Memory flow — state machine
    if (chatState === "memory1") {
      addMessage("user", text);
      const isSkip = /^(skip|no|nope|later|not now)$/i.test(text.trim());
      if (!isSkip) await saveMemory(text);
      setChatState("memory2");
      setTimeout(() => addMessage("assistant",
        "Was this part of a special occasion — a holiday, a celebration, a gathering?"
      ), 300);
      return;
    }

    if (chatState === "memory2") {
      addMessage("user", text);
      const isSkip = /^(skip|no|nope|later|not now)$/i.test(text.trim());
      if (!isSkip) await saveMemory(text);
      setChatState("chatting");
      setTimeout(() => addMessage("assistant",
        `It's all here. Your family's archive is growing. 🌿`
      ), 300);
      return;
    }

    // Intercept "add recipe" intent — show picker instead of API call
    if (/add (this |a |the )?(recipe|dish)/i.test(text) && chatState === "chatting") {
      addMessage("user", text);
      setChatState("adding");
      setShowFollowUpChips(false);
      setTimeout(() => setMessages((prev) => [...prev, {
        role: "assistant",
        content: "How would you like to add it?",
        type: "input_picker",
      }]), 200);
      return;
    }

    // Recipe detection
    const intent = detectRecipeIntent(text);

    if (intent === "url" || intent === "recipe_text") {
      addMessage("user", text);
      setLoading(true);
      addMessage("assistant",
        intent === "url" ? "Pulling that recipe now..." : "I can see a recipe here. Structuring it..."
      );

      try {
        const body = intent === "url" ? { url: text.trim() } : { text: text.trim() };
        const res = await fetch("/api/digitize-text", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();

        if (data.error) {
          setMessages((prev) => [...prev.slice(0, -1)]);
          addMessage("assistant", data.error);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const recipe = Array.isArray(data.recipes) ? data.recipes[0] : data.recipes as any;
          const stepsArr = Array.isArray(recipe?.steps?.value) ? recipe.steps.value : [];
          const ingsArr = Array.isArray(recipe?.ingredients?.value) ? recipe.ingredients.value : [];
          const ingredientCount = ingsArr.reduce((n: number, g: { items?: string[] }) =>
            n + (Array.isArray(g.items) ? g.items.length : 0), 0);

          const card: RecipeCard = {
            title: safeStr(recipe?.title?.value) || "Recipe",
            ingredientCount,
            stepCount: stepsArr.length,
            cookTime: safeStr(recipe?.cook_time?.value) || null,
            raw: recipe,
          };
          setPendingRecipe(recipe);
          setChatState("confirming");
          setMessages((prev) => [...prev.slice(0, -1), {
            role: "assistant", content: "Here's what I found:",
            type: "recipe_card", recipeCard: card,
          }]);
        }
      } catch {
        setMessages((prev) => [...prev.slice(0, -1)]);
        addMessage("assistant", "Couldn't reach that. Try pasting the recipe text instead.");
      }
      setLoading(false);
      return;
    }

    // Normal assistant chat
    const userMsg: ChatMessage = { role: "user", content: text, type: "text" };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          recipeContext,
        }),
      });
      const data = await res.json();
      if (data.text) {
        addMessage("assistant", data.text);
        if (messages.length <= 2) setShowFollowUpChips(true);
      }
    } catch {
      addMessage("assistant", "Something went wrong. Try again.");
    }
    setLoading(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating button — hidden on home */}
      {!open && !isHome && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-40 bg-amber-600 hover:bg-amber-500 rounded-full shadow-lg flex items-center justify-center transition-colors"
          style={{ width: 52, height: 52 }}
          aria-label="Open Heirloom assistant"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Chat overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4 border-b border-stone-100" style={{ paddingTop: 'max(env(safe-area-inset-top), 48px)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-serif text-stone-800 text-base leading-tight">Heirloom</p>
                <p className="text-xs text-amber-700">Your kitchen companion</p>
              </div>
            </div>
            <button onClick={() => { setOpen(false); setChatState("chatting"); }}
              className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* Opener */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <p className="text-stone-800 text-sm leading-relaxed">{opener}</p>
                <p className="text-stone-400 text-xs mt-1.5">Type below to respond ↓</p>
              </div>
            </div>

            {/* Conversation */}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="max-w-[85%] space-y-2">
                  {/* Text bubble */}
                  {m.content && (
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
                      ${m.role === "user"
                        ? "bg-amber-600 text-white rounded-tr-sm"
                        : "bg-stone-50 text-stone-800 rounded-tl-sm"}`}>
                      {m.content}
                    </div>
                  )}

                  {/* Input picker */}
                  {m.type === "input_picker" && chatState === "adding" && (
                    <div className="flex flex-col gap-2 mt-1">
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                      >
                        <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-stone-800">Scan a photo</p>
                          <p className="text-xs text-stone-400">Handwritten card, printout, screen</p>
                        </div>
                      </button>
                      <button
                        onClick={startVoice}
                        className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                      >
                        <Mic className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-stone-800">Speak it</p>
                          <p className="text-xs text-stone-400">Describe the recipe out loud</p>
                        </div>
                      </button>
                      <button
                        onClick={() => { setChatState("chatting"); inputRef.current?.focus(); }}
                        className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                      >
                        <Send className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-stone-800">Type or paste it</p>
                          <p className="text-xs text-stone-400">Paste a link or describe the recipe</p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Recipe card */}
                  {m.type === "recipe_card" && m.recipeCard && (
                    <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                      <p className="font-serif text-stone-800 text-base mb-1">{m.recipeCard.title}</p>
                      <div className="flex gap-3 text-xs text-stone-400 mb-3">
                        {m.recipeCard.ingredientCount > 0 && (
                          <span>{m.recipeCard.ingredientCount} ingredients</span>
                        )}
                        {m.recipeCard.stepCount > 0 && (
                          <span>{m.recipeCard.stepCount} steps</span>
                        )}
                        {m.recipeCard.cookTime && <span>{m.recipeCard.cookTime}</span>}
                      </div>

                      {chatState === "confirming" && i === messages.length - 1 ? (
                        <button onClick={handleSaveRecipe}
                          className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors">
                          Save to my recipes
                        </button>
                      ) : (chatState !== "confirming") && (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Saved
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Follow-up action chips after first exchange */}
            {showFollowUpChips && !loading && chatState === "chatting" && (
              <div className="pl-11 flex flex-wrap gap-2">
                <button onClick={() => { setShowFollowUpChips(false); send("I want to add this recipe"); }}
                  className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
                  📝 Add this recipe
                </button>
                <button onClick={() => { setShowFollowUpChips(false); send("I want to share a memory about this"); }}
                  className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
                  💬 Share a memory
                </button>
                <button onClick={() => { setShowFollowUpChips(false); send("Tell me more about this dish"); }}
                  className="text-xs bg-stone-50 border border-stone-200 text-stone-700 px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors">
                  ✨ Tell me more
                </button>
              </div>
            )}

            {/* Loading */}
            {(loading || chatState === "saving") && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Hidden photo input */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setChatState("chatting"); handlePhotoScan(f); e.target.value = ""; }
            }}
          />

          {/* Voice recording indicator */}
          {isRecording && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-600 font-medium">Recording...</span>
                {transcript && <span className="text-xs text-stone-500 truncate max-w-48">{transcript}</span>}
              </div>
              <button onClick={stopVoice} className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <Square className="w-3 h-3 fill-red-500" /> Stop
              </button>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-stone-100 bg-white pb-safe">
            <div className="px-4 pt-3 pb-2 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder={
                  chatState === "memory1" ? "Share a memory, a person, a gathering..."
                  : chatState === "memory2" ? "A holiday, a celebration, an occasion..."
                  : "Type, paste a link, or describe a recipe..."
                }
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-stone-800"
              />
              <button onClick={() => send(input)} disabled={!input.trim() || loading || chatState === "saving"}
                className="bg-amber-600 text-white rounded-xl px-4 hover:bg-amber-700 transition-colors disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Chips — shown below input before first message */}
            {messages.length === 0 && chatState === "chatting" && (
              <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
                {CHIPS.map((chip) => (
                  <button key={chip} onClick={() => send(chip)}
                    className="shrink-0 text-xs bg-stone-50 border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition-colors">
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Skip during memory prompts */}
            {(chatState === "memory1" || chatState === "memory2") && !loading && (
              <div className="px-4 pb-3">
                <button onClick={() => send("skip")}
                  className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2">
                  Skip for now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
