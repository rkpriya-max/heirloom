import { NextRequest, NextResponse } from "next/server";
import { digitizeRecipes } from "@/lib/claude";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Image must be JPEG, PNG, WebP, or GIF" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = file.type as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    const recipes = await digitizeRecipes(base64, mediaType);

    return NextResponse.json({ recipes, imageBase64: base64, mediaType });
  } catch (error) {
    console.error("Digitize error:", error);
    return NextResponse.json(
      { error: "Failed to digitize recipe. Please try again." },
      { status: 500 }
    );
  }
}
