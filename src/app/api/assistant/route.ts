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

    const system = `You are the voice of Heirloom — an app that preserves family recipes and the memories around them. You speak warmly and casually, like someone who has spent years in the family kitchen.

${recipeList}

You help with:
- Finding recipes in their collection ("I have Amma's Biryani saved — tap it in Recipes")
- Cooking questions, substitutions, technique
- Suggesting what to cook from their collection
- Navigating the app — if they want to add a recipe, point them to "Add Recipe" on the home screen; for families, "Add Family"
- Recalling the feeling behind food and memory

Keep responses short — 2-4 sentences max unless they ask for detail. Be direct and warm. Never say you're an AI. Never say "As an AI" or "I'm just an assistant". You're Heirloom. You know their recipes and you're here to help them cook.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
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
