import { NextRequest, NextResponse } from "next/server";
import { generateCritique } from "@/lib/gemini";
import { AudioSample } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, samples } = body as { text: string; samples: AudioSample[] };

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return NextResponse.json(
        { success: false, error: "Audio samples are required" },
        { status: 400 }
      );
    }

    const report = await generateCritique(text, samples);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating critique:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Increase timeout for this route since Gemini Pro analysis may take time
export const maxDuration = 300; // 5 minutes
