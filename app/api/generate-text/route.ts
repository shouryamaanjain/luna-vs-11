import { NextResponse } from "next/server";
import { generateTextSample } from "@/lib/gemini";

export async function POST() {
  try {
    const text = await generateTextSample();

    return NextResponse.json({
      success: true,
      text,
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
