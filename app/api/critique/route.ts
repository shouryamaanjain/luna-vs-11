import { NextRequest, NextResponse } from "next/server";
import { generateCritique, generateCritiqueSingleText, AudioSampleWithText } from "@/lib/gemini";
import { AudioSample } from "@/lib/config";

interface TextItem {
  category: string;
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, samples } = body as {
      text?: string;
      texts?: TextItem[];
      samples: (AudioSample | AudioSampleWithText)[];
    };

    // Support both old format (single text) and new format (multiple texts)
    const hasTexts = texts && Array.isArray(texts) && texts.length > 0;
    const hasSingleText = typeof text === "string" && text.length > 0;

    if (!hasTexts && !hasSingleText) {
      return NextResponse.json(
        { success: false, error: "Text or texts array is required" },
        { status: 400 }
      );
    }

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return NextResponse.json(
        { success: false, error: "Audio samples are required" },
        { status: 400 }
      );
    }

    let report;
    if (hasTexts) {
      // New format: multiple texts with samples that have textIndex
      report = await generateCritique(texts, samples as AudioSampleWithText[]);
    } else {
      // Legacy format: single text
      report = await generateCritiqueSingleText(text!, samples);
    }

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

// Increase body size limit for this route (audio samples are large)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
