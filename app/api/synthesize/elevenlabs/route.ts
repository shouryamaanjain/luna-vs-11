import { NextRequest, NextResponse } from "next/server";
import { generatePixaSamples } from "@/lib/elevenlabs";
import { config } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, count = config.samples.countPerProvider } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    const samples = await generatePixaSamples(text, count);

    return NextResponse.json({
      success: true,
      samples,
      count: samples.length,
    });
  } catch (error) {
    console.error("Error synthesizing with ElevenLabs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Increase timeout for this route since we're generating multiple samples
export const maxDuration = 120; // 120 seconds (ElevenLabs may need more time with rate limits)
