import { NextRequest, NextResponse } from "next/server";
import { generateTextSample, generateAllCategoryTexts } from "@/lib/gemini";
import type { TextCategory } from "@/lib/database.types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { category, generateAll } = body as { category?: TextCategory; generateAll?: boolean };

    // Generate all category texts at once
    if (generateAll) {
      const texts = await generateAllCategoryTexts();
      return NextResponse.json({
        success: true,
        texts,
      });
    }

    // Generate single text for specific category
    const text = await generateTextSample(category || "custom");

    return NextResponse.json({
      success: true,
      text,
      category: category || "custom",
    });
  } catch (error) {
    console.error("Error generating text:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
