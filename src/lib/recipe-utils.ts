export interface IngredientSection { section?: string; items: string[] }

export function safeStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

export function textToIngredients(text: string): IngredientSection[] {
  if (!text.trim()) return [];
  const sections: IngredientSection[] = [];
  let current: IngredientSection = { items: [] };
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("##")) {
      if (current.items.length > 0 || current.section) sections.push(current);
      current = { section: trimmed.replace(/^##\s*/, ""), items: [] };
    } else {
      current.items.push(trimmed);
    }
  }
  if (current.items.length > 0) sections.push(current);
  return sections;
}

export function textToSteps(text: string): string[] {
  if (!text.trim()) return [];
  return text.split("\n").map((l) => l.trim().replace(/^\d+\.\s*/, "")).filter(Boolean);
}

export function detectRecipeIntent(msg: string): "url" | "recipe_text" | "chat" {
  if (/https?:\/\/\S+/.test(msg)) return "url";
  const patterns = [
    /\d+\s*(cup|tbsp|tsp|gram|g|kg|oz|lb|ml|litre|liter|handful|pinch)\b/i,
    /\b(ingredients?|instructions?|method|steps?)\s*:/i,
    /\b(mix|stir|cook|bake|boil|fry|sauté|add|combine|heat|simmer|chop|slice)\b.{0,40}\b(until|for|over|and)\b/i,
  ];
  if (patterns.filter((p) => p.test(msg)).length >= 2) return "recipe_text";
  return "chat";
}
