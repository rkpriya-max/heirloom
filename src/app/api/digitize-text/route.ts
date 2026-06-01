import { NextResponse } from "next/server";
import { extractRecipeFromText } from "@/lib/claude";

export const maxDuration = 30;

function extractFromHtml(html: string): string {
  // Try JSON-LD structured data first (most recipe sites use this)
  const jsonLdMatches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      const recipe = items.find((d) => d["@type"] === "Recipe" || (Array.isArray(d["@type"]) && d["@type"].includes("Recipe")));
      if (recipe) {
        const instructions = Array.isArray(recipe.recipeInstructions)
          ? recipe.recipeInstructions.map((s: { text?: string } | string) => (typeof s === "string" ? s : s.text ?? "")).join("\n")
          : recipe.recipeInstructions ?? "";
        const parts = [
          recipe.name ? `Recipe: ${recipe.name}` : "",
          recipe.description ? `Description: ${recipe.description}` : "",
          recipe.recipeYield ? `Yield: ${Array.isArray(recipe.recipeYield) ? recipe.recipeYield.join(", ") : recipe.recipeYield}` : "",
          recipe.totalTime ? `Total time: ${recipe.totalTime}` : "",
          recipe.recipeIngredient?.length ? `Ingredients:\n${recipe.recipeIngredient.join("\n")}` : "",
          instructions ? `Instructions:\n${instructions}` : "",
          recipe.description ? `Notes: ${recipe.description}` : "",
        ].filter(Boolean).join("\n\n");
        if (parts.length > 100) return parts;
      }
    } catch {
      // continue to next match
    }
  }

  // Fall back: strip HTML tags and collapse whitespace
  return html
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
}

export async function POST(req: Request) {
  try {
    const { text, url } = await req.json() as { text?: string; url?: string };

    let content = text?.trim() ?? "";

    if (url) {
      const fetched = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Heirloom/1.0; +https://heirloom-indol.vercel.app)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!fetched.ok) throw new Error(`Could not fetch that URL (${fetched.status})`);
      const html = await fetched.text();
      content = extractFromHtml(html);

      // If we got very little content the page is likely paywalled, requires login,
      // or is heavily JavaScript-rendered (e.g. WaPo, NYT, subscription sites).
      if (content.length < 300) {
        return NextResponse.json({
          error: "This page couldn't be read — it may be paywalled or require a login. Copy the recipe text and use the Text tab instead.",
          paywall: true,
        }, { status: 422 });
      }
    }

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
