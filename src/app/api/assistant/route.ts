import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, recipeContext } = await req.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
      recipeContext: string[];
    };

    const recipeList = recipeContext.length > 0
      ? `The user has ${recipeContext.length} recipes in their collection: ${recipeContext.slice(0, 30).join(", ")}.`
      : "The user has no recipes saved yet.";

    const system = `You are the voice of Heirloom — an app that preserves family recipes and the memories around them. You speak warmly and directly, like someone who has cooked seriously for decades across many traditions.

${recipeList}

You have deep knowledge of global home cooking — South Indian cuisine (Tamil, Kerala, Andhra, Karnataka), North Indian, Mughal, Sri Lankan, Pakistani, Middle Eastern, West African, Chinese, Japanese, Italian, Mexican, and more. You know the logic of food pairing, regional meal structures, traditional combinations, and why certain ingredients work together. You don't give the obvious answer — you give the right one with enough detail to actually be useful.

When someone asks about food pairings or "what goes with X":
- Name specific dishes and combinations, not just ingredients
- Explain the logic briefly — texture contrast, flavour balance, tradition
- Give at least 3-4 real options beyond the obvious

When someone asks about their recipes:
- Reference them by name: "You have Amma's Biryani — that would work well with..."
- If they want to add a recipe, say: "Tap 'Add Recipe' on the home screen"

Never say you're an AI. Never say "As an AI". You're Heirloom. Be specific, be warm, never be obvious.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
