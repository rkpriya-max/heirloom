import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface IngredientSection {
  section?: string;
  items: string[];
}

export interface RecipeField<T> {
  value: T;
  confidence: number;
  needs_review: boolean;
}

export interface ExtractedRecipe {
  title: RecipeField<string>;
  ingredients: RecipeField<IngredientSection[]>;
  steps: RecipeField<string[]>;
  yield: RecipeField<string>;
  cook_time: RecipeField<string>;
  notes: RecipeField<string>;
  raw_transcription: string;
}

const DIGITIZE_PROMPT = `You are digitizing handwritten or typed family recipe cards for heritage preservation. Accuracy is critical.

STEP 1: Count how many distinct recipes are on this card/page.
- A distinct recipe has its own title and its own ingredient list.
- If one recipe has named sub-components (e.g. "For the sauce:", "Dough:"), that is ONE recipe with sections, not multiple recipes.

STEP 2: Return a JSON object with this structure:

{
  "recipes": [
    {
      "title": { "value": "...", "confidence": 0.0-1.0 },
      "ingredients": {
        "value": [
          { "section": "optional section header or null", "items": ["ingredient 1", "ingredient 2"] }
        ],
        "confidence": 0.0-1.0
      },
      "steps": { "value": ["step 1", "step 2"], "confidence": 0.0-1.0 },
      "yield": { "value": "...", "confidence": 0.0-1.0 },
      "cook_time": { "value": "...", "confidence": 0.0-1.0 },
      "notes": { "value": "...", "confidence": 0.0-1.0 }
    }
  ],
  "raw_transcription": "exact text as written"
}

Rules:
- If there are 3 recipes on the page, return 3 objects in the recipes array.
- Do NOT merge separate recipes. Do NOT prefix ingredients with the recipe name.
- Confidence < 0.85 = flag for human review.
- Preserve exact measurements — never guess if unclear, use [unclear] instead.
- Preserve original phrasing and language. Do not standardize or translate.
- Include margin notes, annotations, and family tips in the notes field.
- Return ONLY valid JSON. No markdown fences.`;

function markField<T>(field: { value: T; confidence: number }): RecipeField<T> {
  return {
    value: field.value,
    confidence: field.confidence,
    needs_review: field.confidence < 0.85,
  };
}

function normalizeIngredients(raw: unknown): IngredientSection[] {
  if (!Array.isArray(raw)) return [{ items: [] }];

  // Already in section format
  if (raw.length > 0 && typeof raw[0] === "object" && "items" in (raw[0] as object)) {
    return raw as IngredientSection[];
  }

  // Flat string array — wrap in a single unsectioned group
  return [{ items: raw.filter((i) => typeof i === "string") as string[] }];
}

export async function digitizeRecipes(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<ExtractedRecipe[]> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          { type: "text", text: DIGITIZE_PROMPT },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  // Extract JSON robustly: strip markdown fences, then find the outermost { }
  const stripped = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
  const jsonStart = stripped.indexOf("{");
  const jsonEnd = stripped.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error(`No JSON found in response: ${text.slice(0, 200)}`);
  const jsonText = stripped.slice(jsonStart, jsonEnd + 1);
  const parsed = JSON.parse(jsonText);

  const rawRecipes = Array.isArray(parsed.recipes) ? parsed.recipes : [parsed];
  const rawTranscription = parsed.raw_transcription ?? "";

  return rawRecipes.map(
    (r: {
      title: { value: string; confidence: number };
      ingredients: { value: unknown; confidence: number };
      steps: { value: string[]; confidence: number };
      yield: { value: string; confidence: number };
      cook_time: { value: string; confidence: number };
      notes: { value: string; confidence: number };
    }): ExtractedRecipe => ({
      title: markField<string>(r.title),
      ingredients: {
        value: normalizeIngredients(r.ingredients?.value),
        confidence: r.ingredients?.confidence ?? 1,
        needs_review: (r.ingredients?.confidence ?? 1) < 0.85,
      },
      steps: markField<string[]>(r.steps ?? { value: [], confidence: 1 }),
      yield: markField<string>(r.yield ?? { value: "", confidence: 1 }),
      cook_time: markField<string>(r.cook_time ?? { value: "", confidence: 1 }),
      notes: markField<string>(r.notes ?? { value: "", confidence: 1 }),
      raw_transcription: rawTranscription,
    })
  );
}

export function countReviewFlags(recipe: ExtractedRecipe): number {
  return [recipe.title, recipe.ingredients, recipe.steps, recipe.yield, recipe.cook_time, recipe.notes]
    .filter((f) => f.needs_review).length;
}
