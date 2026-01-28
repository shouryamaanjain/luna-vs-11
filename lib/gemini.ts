import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { config, CritiqueReport, AudioSample } from "./config";

// Initialize the Google AI client
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
}

// Prompt for generating challenging multi-language text
const TEXT_GENERATION_PROMPT = `You are a linguistic expert specializing in Hindi, Hinglish (Hindi written in Roman script), and English. Generate a challenging text sample that will be used to test Text-to-Speech systems.

Requirements:
1. The text should be 2-4 sentences long
2. It MUST contain a mix of:
   - English words (including some technical terms or harder-to-pronounce words)
   - Hinglish words (Hindi written in Roman/English script, e.g., "kaise", "bahut", "accha")
   - Hindi words in Devanagari script (e.g., "शिक्षक", "विज्ञान", "अद्भुत")
3. Include words that are challenging to pronounce:
   - Tongue twisters or alliterations
   - Technical/scientific terms
   - Proper nouns (Indian names, places)
   - Words with complex consonant clusters
4. The text should form a coherent, meaningful passage (not random words)
5. Distribute the three language types randomly throughout the text

Example format:
"The शिक्षक explained kaise quantum entanglement works in the लैब, while Shrinivas demonstrated the विस्मयकारी phenomenon."

Generate ONLY the text sample, nothing else. No explanations or metadata.`;

// Prompt for critique analysis
function getCritiquePrompt(originalText: string): string {
  return `You are an expert linguist and audio quality analyst specializing in Hindi, Hinglish, and English speech synthesis evaluation.

ORIGINAL TEXT TO BE SPOKEN:
"${originalText}"

You will receive 20 audio samples in the following order:

HEYPIXA SAMPLES (Voice: Devi) - 10 samples:
  heypixa-1, heypixa-2, heypixa-3, heypixa-4, heypixa-5, heypixa-6, heypixa-7, heypixa-8, heypixa-9, heypixa-10

ELEVENLABS SAMPLES (Voice: Neha) - 10 samples:
  elevenlabs-1, elevenlabs-2, elevenlabs-3, elevenlabs-4, elevenlabs-5, elevenlabs-6, elevenlabs-7, elevenlabs-8, elevenlabs-9, elevenlabs-10

Each audio sample is labeled with its name (e.g., "=== AUDIO: heypixa-1 ==="). 
All samples are synthesized from the exact same text above. Your task is to perform a comprehensive analysis.

ANALYSIS REQUIREMENTS:

1. PRONUNCIATION ERRORS:
   - Identify any mispronounced words
   - Note the language of the word (English/Hindi/Hinglish)
   - Describe expected vs actual pronunciation
   - Track which samples have each error and frequency

2. ACCENT ISSUES:
   - Hindi/Hinglish words spoken with English accent (should sound native)
   - English words with incorrect accent
   - Inconsistent accent within same word across samples

3. AUDIO ARTIFACTS:
   - Clicks, pops, or glitches
   - Unnatural pauses or gaps
   - Distortion or clipping
   - Robotic or metallic sound
   - Track frequency across samples

4. CROSS-SAMPLE CONSISTENCY:
   - Same word pronounced differently across samples from same provider
   - Inconsistent pacing or rhythm
   - Volume variations

5. EMOTIONAL EXPRESSIVENESS:
   - Does the voice convey appropriate emotion for the content?
   - Identify "dull moments" - parts where the speech sounds flat/monotone when it should have more expression
   - Consider: excitement for interesting facts, emphasis on important words, natural pitch variation
   - Rate overall emotional expressiveness (0-100)

6. OVERALL QUALITY SCORES (0-100):
   - Hindi pronunciation accuracy
   - Hinglish pronunciation accuracy
   - English pronunciation accuracy
   - Naturalness and fluency
   - Emotional expressiveness

RESPOND IN THIS EXACT JSON FORMAT:

NOTE: For sampleIndices arrays, use 0-based indices (0-9) corresponding to the sample numbers (1-10).
Example: If heypixa-1 and heypixa-3 have an error, use sampleIndices: [0, 2]

{
  "summary": {
    "totalSamples": 20,
    "heypixaSamples": 10,
    "elevenlabsSamples": 10,
    "overallQuality": {
      "heypixa": <0-100>,
      "elevenlabs": <0-100>
    }
  },
  "heypixaAnalysis": {
    "pronunciationErrors": [
      {
        "word": "<word>",
        "language": "english|hindi|hinglish",
        "expectedPronunciation": "<description>",
        "actualPronunciation": "<description>",
        "frequency": <count of samples with this error>,
        "sampleIndices": [<0-based indices, e.g., [0,2,5] means heypixa-1, heypixa-3, heypixa-6>]
      }
    ],
    "accentIssues": [
      {
        "word": "<word>",
        "language": "english|hindi|hinglish",
        "issue": "<description>",
        "frequency": <count>,
        "sampleIndices": [<0-based indices>]
      }
    ],
    "artifacts": [
      {
        "type": "click|pop|unnatural_pause|distortion|other",
        "description": "<description>",
        "frequency": <count>,
        "sampleIndices": [<0-based indices>]
      }
    ],
    "dullMoments": [
      {
        "text": "<the phrase or word that sounded dull>",
        "expectedEmotion": "<what emotion/expression was expected>",
        "issue": "<description of why it sounded flat>",
        "sampleIndices": [<0-based indices>]
      }
    ],
    "consistencyScore": <0-100>,
    "expressivenessScore": <0-100>,
    "overallScore": <0-100>
  },
  "elevenlabsAnalysis": {
    "pronunciationErrors": [...same structure as above...],
    "accentIssues": [...],
    "artifacts": [...],
    "dullMoments": [...],
    "consistencyScore": <0-100>,
    "expressivenessScore": <0-100>,
    "overallScore": <0-100>
  },
  "comparison": {
    "winner": "heypixa|elevenlabs|tie",
    "reasoning": "<detailed reasoning>",
    "hindiAccuracy": {
      "heypixa": <0-100>,
      "elevenlabs": <0-100>
    },
    "hinglishAccuracy": {
      "heypixa": <0-100>,
      "elevenlabs": <0-100>
    },
    "englishAccuracy": {
      "heypixa": <0-100>,
      "elevenlabs": <0-100>
    },
    "naturalness": {
      "heypixa": <0-100>,
      "elevenlabs": <0-100>
    },
    "emotionalExpressiveness": {
      "heypixa": <0-100>,
      "elevenlabs": <0-100>
    }
  }
}

Be thorough and critical. If you cannot detect certain issues, still include the fields with empty arrays or appropriate default values.`;
}

/**
 * Generate a challenging multi-language text sample using Gemini Flash
 */
export async function generateTextSample(): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: config.gemini.flashModel });

  const result = await model.generateContent(TEXT_GENERATION_PROMPT);
  const response = result.response;
  const text = response.text().trim();

  // Remove any surrounding quotes if present
  return text.replace(/^["']|["']$/g, "");
}

/**
 * Analyze audio samples and generate a critique report using Gemini Pro
 */
export async function generateCritique(
  originalText: string,
  samples: AudioSample[]
): Promise<CritiqueReport> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: config.gemini.proModel });

  // Sort samples: ElevenLabs first (0-9), then Pixa (10-19)
  const sortedSamples = [...samples].sort((a, b) => {
    if (a.provider !== b.provider) {
      return a.provider === "heypixa" ? -1 : 1;
    }
    return a.sampleIndex - b.sampleIndex;
  });

  // Build the content parts with audio files
  const parts: Part[] = [
    { text: getCritiquePrompt(originalText) },
    { text: "\n\n=== AUDIO SAMPLES START ===\n" },
    { text: "The following audio samples are in order: first all 10 ElevenLabs samples (heypixa-1 through heypixa-10), then all 10 Pixa samples (elevenlabs-1 through elevenlabs-10).\n" },
  ];

  // Add each audio sample as inline data with clear naming
  for (let i = 0; i < sortedSamples.length; i++) {
    const sample = sortedSamples[i];
    const sampleNumber = sample.sampleIndex + 1; // 1-indexed
    const sampleName = `${sample.provider}-${sampleNumber}`;

    parts.push({
      text: `\n=== AUDIO: ${sampleName} ===\n`,
    });

    parts.push({
      inlineData: {
        mimeType: sample.mimeType,
        data: sample.audioBase64,
      },
    });
  }

  // Add end marker
  parts.push({
    text: "\n=== AUDIO SAMPLES END ===\n",
  });

  const result = await model.generateContent(parts);
  const response = result.response;
  const responseText = response.text();

  // Extract JSON from the response
  let jsonStr = responseText;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr) as CritiqueReport;
    parsed.rawResponse = responseText;
    return parsed;
  } catch {
    // If JSON parsing fails, return a structured error response
    return {
      summary: {
        totalSamples: samples.length,
        heypixaSamples: samples.filter((s) => s.provider === "heypixa").length,
        elevenlabsSamples: samples.filter((s) => s.provider === "elevenlabs").length,
        overallQuality: { heypixa: 0, elevenlabs: 0 },
      },
      heypixaAnalysis: {
        pronunciationErrors: [],
        accentIssues: [],
        artifacts: [],
        dullMoments: [],
        consistencyScore: 0,
        expressivenessScore: 0,
        overallScore: 0,
      },
      elevenlabsAnalysis: {
        pronunciationErrors: [],
        accentIssues: [],
        artifacts: [],
        dullMoments: [],
        consistencyScore: 0,
        expressivenessScore: 0,
        overallScore: 0,
      },
      comparison: {
        winner: "tie",
        reasoning: `Failed to parse critique response: ${responseText}`,
        hindiAccuracy: { heypixa: 0, elevenlabs: 0 },
        hinglishAccuracy: { heypixa: 0, elevenlabs: 0 },
        englishAccuracy: { heypixa: 0, elevenlabs: 0 },
        naturalness: { heypixa: 0, elevenlabs: 0 },
        emotionalExpressiveness: { heypixa: 0, elevenlabs: 0 },
      },
      rawResponse: responseText,
    };
  }
}
