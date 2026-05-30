import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface RecipeField {
  value: string;
  confidence: number;
  needs_review: boolean;
}

export interface ExtractedRecipe {
  title: RecipeField;
  ingredients: { value: string[]; confidence: number; needs_review: boolean };
  steps: { value: string[]; confidence: number; needs_review: boolean };
  yield: RecipeField;
  cook_time: RecipeField;
  notes: RecipeField;
  raw_transcription: string;
}

const DIGITIZE_PROMPT = `You are digitizing a handwritten family recipe card. This is heritage preservation work — accuracy matters more than speed.

Extract the following fields from the recipe card image:
- title: the recipe name
- ingredients: an array of ingredients with exact quantities and units
- steps: an array of numbered cooking instructions
- yield: serving size or batch size if present
- cook_time: preparation and cooking time if present
- notes: any margin notes, family annotations, or additional context written on the card

Return ONLY valid JSON with this exact structure:
{
  "title": { "value": "...", "confidence": 0.0-1.0 },
  "ingredients": { "value": ["..."], "confidence": 0.0-1.0 },
  "steps": { "value": ["..."], "confidence": 0.0-1.0 },
  "yield": { "value": "...", "confidence": 0.0-1.0 },
  "cook_time": { "value": "...", "confidence": 0.0-1.0 },
  "notes": { "value": "...", "confidence": 0.0-1.0 },
  "raw_transcription": "exact text as written on the card"
}

Rules:
- Confidence 0.85+ means you are certain. Below 0.85 means flag for human review.
- For ingredients: preserve exact measurements (1/4 tsp, not 0.25 tsp). These are the most critical fields.
- If you cannot read a word clearly, write [unclear] — never guess at measurements or temperatures.
- Preserve the original phrasing — do not standardize or modernize the language.
- Include all margin notes and annotations in the notes field.`;

export async function digitizeRecipe(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<ExtractedRecipe> {
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: DIGITIZE_PROMPT,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown code fences if present
  const jsonText = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(jsonText);

  const mark = <T,>(field: { value: T; confidence: number }) => ({
    value: field.value,
    confidence: field.confidence,
    needs_review: field.confidence < 0.85,
  });

  return {
    title: mark<string>(parsed.title),
    ingredients: mark<string[]>(parsed.ingredients),
    steps: mark<string[]>(parsed.steps),
    yield: mark<string>(parsed.yield),
    cook_time: mark<string>(parsed.cook_time),
    notes: mark<string>(parsed.notes),
    raw_transcription: parsed.raw_transcription as string,
  };
}

export function countReviewFlags(recipe: ExtractedRecipe): number {
  return [
    recipe.title,
    recipe.ingredients,
    recipe.steps,
    recipe.yield,
    recipe.cook_time,
    recipe.notes,
  ].filter((f) => f.needs_review).length;
}
