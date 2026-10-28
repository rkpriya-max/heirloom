import { NextResponse } from "next/server";
import { extractRecipeFromText, type ExtractedRecipe, type IngredientSection } from "@/lib/claude";

export const maxDuration = 30;

function makeField<T>(value: T): { value: T; confidence: number; needs_review: boolean } {
  return { value, confidence: 1, needs_review: false };
}

// Parse JSON-LD recipe data directly — no Claude call needed
function parseJsonLdRecipe(recipe: Record<string, unknown>): ExtractedRecipe | null {
  const name = typeof recipe.name === "string" ? recipe.name.trim() : "";
  const ingredients = Array.isArray(recipe.recipeIngredient)
    ? (recipe.recipeIngredient as unknown[]).filter((i): i is string => typeof i === "string")
    : [];
  const rawInstructions = recipe.recipeInstructions;
  const steps: string[] = Array.isArray(rawInstructions)
    ? (rawInstructions as unknown[]).map((s) =>
        typeof s === "string" ? s : (s as Record<string, unknown>).text as string ?? ""
      ).filter(Boolean)
    : typeof rawInstructions === "string" ? [rawInstructions] : [];

  if (!name || ingredients.length === 0) return null;

  const sections: IngredientSection[] = [{ items: ingredients }];
  const yieldVal = Array.isArray(recipe.recipeYield)
    ? (recipe.recipeYield as unknown[]).join(", ")
    : typeof recipe.recipeYield === "string" ? recipe.recipeYield : "";
  const totalTime = typeof recipe.totalTime === "string" ? recipe.totalTime : "";
  const description = typeof recipe.description === "string" ? recipe.description : "";

  return {
    title: makeField(name),
    ingredients: makeField(sections),
    steps: makeField(steps),
    yield: makeField(yieldVal),
    cook_time: makeField(totalTime),
    notes: makeField(description),
    raw_transcription: "",
  };
}

function extractFromHtml(html: string): { structured: ExtractedRecipe | null; text: string } {
  // Try JSON-LD first — if clean, return structured data directly (no Claude needed)
  const jsonLdMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      const recipe = items.find(
        (d: Record<string, unknown>) => d["@type"] === "Recipe" || (Array.isArray(d["@type"]) && (d["@type"] as string[]).includes("Recipe"))
      ) as Record<string, unknown> | undefined;
      if (recipe) {
        const structured = parseJsonLdRecipe(recipe);
        if (structured) return { structured, text: "" };
      }
    } catch {
      // continue to next match
    }
  }

  // Fall back to plain text for Claude to parse
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .slice(0, 8000)
    .trim();

  return { structured: null, text };
}

export async function POST(req: Request) {
  try {
    const { text, url } = await req.json() as { text?: string; url?: string };

    if (url) {
      const fetched = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SundaysLunch/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!fetched.ok) throw new Error(`Could not fetch that URL (${fetched.status})`);
      const html = await fetched.text();
      const { structured, text: fallbackText } = extractFromHtml(html);

      // Clean JSON-LD found — return directly, no Claude call
      if (structured) {
        return NextResponse.json({ recipes: [structured] });
      }

      if (fallbackText.length < 300) {
        return NextResponse.json({
          error: "This page couldn't be read — it may be paywalled or require a login. Copy the recipe text and use the Text tab instead.",
          paywall: true,
        }, { status: 422 });
      }

      const recipes = await extractRecipeFromText(fallbackText);
      return NextResponse.json({ recipes });
    }

    const content = text?.trim() ?? "";
    if (!content) {
      return NextResponse.json({ error: "Nothing to extract — paste some text or a recipe URL." }, { status: 400 });
    }

    const recipes = await extractRecipeFromText(content);
    return NextResponse.json({ recipes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to extract: ${msg.slice(0, 120)}` }, { status: 500 });
  }
}
