import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { config, CritiqueReport, AudioSample } from "./config";
import type { TextCategory } from "./database.types";

// Initialize the Google AI client
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
}

// Category-specific prompts for pure Devanagari text generation
const CATEGORY_PROMPTS: Record<TextCategory, string> = {
  names_places: `आप एक भाषा विशेषज्ञ हैं। Text-to-Speech प्रणालियों के परीक्षण के लिए एक चुनौतीपूर्ण हिंदी पाठ उत्पन्न करें।

आवश्यकताएं:
1. पाठ 2-4 वाक्यों का होना चाहिए
2. पूरी तरह से देवनागरी लिपि में हिंदी होनी चाहिए (कोई अंग्रेजी या रोमन लिपि नहीं)
3. इसमें शामिल होना चाहिए:
   - भारतीय नाम (जैसे: श्रीनिवास, चंद्रशेखर, लक्ष्मीबाई, रामानुजन)
   - भारतीय शहर और स्थान (जैसे: तिरुवनंतपुरम, विशाखापट्टनम, कन्याकुमारी)
   - ऐतिहासिक स्थल और स्मारक
   - जटिल व्यंजन संयोजन वाले नाम
4. पाठ एक सुसंगत, अर्थपूर्ण गद्यांश बनाना चाहिए

केवल पाठ उत्पन्न करें, कोई स्पष्टीकरण नहीं।`,

  currencies: `आप एक भाषा विशेषज्ञ हैं। Text-to-Speech प्रणालियों के परीक्षण के लिए एक चुनौतीपूर्ण हिंदी पाठ उत्पन्न करें।

आवश्यकताएं:
1. पाठ 2-4 वाक्यों का होना चाहिए
2. पूरी तरह से देवनागरी लिपि में हिंदी होनी चाहिए (कोई अंग्रेजी या रोमन लिपि नहीं)
3. इसमें शामिल होना चाहिए:
   - मुद्रा और धनराशि (जैसे: एक करोड़ पच्चीस लाख रुपये, सत्तर हज़ार तीन सौ पैंतीस)
   - वित्तीय शब्दावली (जैसे: ब्याज दर, मूलधन, किस्त, ऋण)
   - बड़ी संख्याएं शब्दों में
   - प्रतिशत और अनुपात
4. पाठ एक सुसंगत, अर्थपूर्ण गद्यांश बनाना चाहिए

केवल पाठ उत्पन्न करें, कोई स्पष्टीकरण नहीं।`,

  date_time: `आप एक भाषा विशेषज्ञ हैं। Text-to-Speech प्रणालियों के परीक्षण के लिए एक चुनौतीपूर्ण हिंदी पाठ उत्पन्न करें।

आवश्यकताएं:
1. पाठ 2-4 वाक्यों का होना चाहिए
2. पूरी तरह से देवनागरी लिपि में हिंदी होनी चाहिए (कोई अंग्रेजी या रोमन लिपि नहीं)
3. इसमें शामिल होना चाहिए:
   - तिथियां (जैसे: पच्चीस जनवरी उन्नीस सौ पचास, बाईस अगस्त दो हज़ार चौबीस)
   - समय (जैसे: सुबह सात बजकर पैंतालीस मिनट, रात ग्यारह बजकर तीस मिनट)
   - अवधि (जैसे: तीन घंटे बयालीस मिनट, दो दिन अठारह घंटे)
   - हिंदी महीने और दिन के नाम
4. पाठ एक सुसंगत, अर्थपूर्ण गद्यांश बनाना चाहिए

केवल पाठ उत्पन्न करें, कोई स्पष्टीकरण नहीं।`,

  custom: `आप एक भाषा विशेषज्ञ हैं। Text-to-Speech प्रणालियों के परीक्षण के लिए एक चुनौतीपूर्ण हिंदी पाठ उत्पन्न करें।

आवश्यकताएं:
1. पाठ 2-4 वाक्यों का होना चाहिए
2. पूरी तरह से देवनागरी लिपि में हिंदी होनी चाहिए (कोई अंग्रेजी या रोमन लिपि नहीं)
3. इसमें जटिल और चुनौतीपूर्ण शब्द शामिल होने चाहिए
4. पाठ एक सुसंगत, अर्थपूर्ण गद्यांश बनाना चाहिए

केवल पाठ उत्पन्न करें, कोई स्पष्टीकरण नहीं।`,
};

// Prompt for critique analysis with multiple texts
function getCritiquePrompt(texts: { category: string; text: string }[], samplesPerText: number): string {
  const totalSamplesPerProvider = texts.length * samplesPerText;
  const totalSamples = totalSamplesPerProvider * 2;

  const textsDescription = texts
    .map((t, i) => `Text ${i + 1} (${t.category}): "${t.text}"`)
    .join("\n");

  return `You are an expert linguist and audio quality analyst specializing in Hindi speech synthesis evaluation.

ORIGINAL TEXTS TO BE SPOKEN:
${textsDescription}

You will receive ${totalSamples} audio samples organized as follows:

For each text, there are ${samplesPerText} samples from each provider (${samplesPerText * 2} samples per text).

SAMPLE NAMING FORMAT:
- heypixa-text{textIndex}-sample{sampleIndex} (e.g., heypixa-text1-sample1, heypixa-text1-sample2, etc.)
- elevenlabs-text{textIndex}-sample{sampleIndex}

HEYPIXA SAMPLES (Voice: Neha) - ${totalSamplesPerProvider} samples total
ELEVENLABS SAMPLES (Voice: Devi) - ${totalSamplesPerProvider} samples total

Each audio sample is labeled clearly. Your task is to perform a comprehensive analysis.

ANALYSIS REQUIREMENTS:

1. PRONUNCIATION ERRORS:
   - Identify any mispronounced Hindi words
   - Describe expected vs actual pronunciation
   - Track which samples have each error and frequency

2. ACCENT ISSUES:
   - Hindi words spoken with incorrect accent
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
   - Identify "dull moments" - parts where the speech sounds flat/monotone
   - Rate overall emotional expressiveness (0-100)

6. OVERALL QUALITY SCORES (0-100):
   - Hindi pronunciation accuracy
   - Naturalness and fluency
   - Emotional expressiveness

RESPOND IN THIS EXACT JSON FORMAT:

{
  "summary": {
    "totalSamples": ${totalSamples},
    "heypixaSamples": ${totalSamplesPerProvider},
    "elevenlabsSamples": ${totalSamplesPerProvider},
    "overallQuality": {
      "heypixa": <0-100>,
      "elevenlabs": <0-100>
    }
  },
  "heypixaAnalysis": {
    "pronunciationErrors": [
      {
        "word": "<word>",
        "language": "hindi",
        "expectedPronunciation": "<description>",
        "actualPronunciation": "<description>",
        "frequency": <count of samples with this error>,
        "sampleIndices": [<0-based indices>]
      }
    ],
    "accentIssues": [
      {
        "word": "<word>",
        "language": "hindi",
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
 * Generate a challenging Hindi text sample for a specific category using Gemini Flash
 */
export async function generateTextSample(category: TextCategory = "custom"): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: config.gemini.flashModel });

  const prompt = CATEGORY_PROMPTS[category];
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text().trim();

  // Remove any surrounding quotes if present
  return text.replace(/^["']|["']$/g, "");
}

/**
 * Generate text samples for all default categories
 */
export async function generateAllCategoryTexts(): Promise<{ category: TextCategory; text: string }[]> {
  const categories: TextCategory[] = ["names_places", "currencies", "date_time"];
  const results: { category: TextCategory; text: string }[] = [];

  for (const category of categories) {
    const text = await generateTextSample(category);
    results.push({ category, text });
  }

  return results;
}

// Extended AudioSample with text reference
export interface AudioSampleWithText extends AudioSample {
  textIndex: number;
  textCategory: string;
}

/**
 * Analyze audio samples and generate a critique report using Gemini Pro
 * @param texts Array of texts with their categories
 * @param samples All audio samples with text references
 */
export async function generateCritique(
  texts: { category: string; text: string }[],
  samples: AudioSampleWithText[]
): Promise<CritiqueReport> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: config.gemini.proModel });

  const samplesPerText = config.samples.countPerText;

  // Sort samples: by text index, then by provider (Pixa first), then by sample index
  const sortedSamples = [...samples].sort((a, b) => {
    if (a.textIndex !== b.textIndex) return a.textIndex - b.textIndex;
    if (a.provider !== b.provider) return a.provider === "heypixa" ? -1 : 1;
    return a.sampleIndex - b.sampleIndex;
  });

  // Build the content parts with audio files
  const parts: Part[] = [
    { text: getCritiquePrompt(texts, samplesPerText) },
    { text: "\n\n=== AUDIO SAMPLES START ===\n" },
  ];

  // Add each audio sample as inline data with clear naming
  for (const sample of sortedSamples) {
    const textNum = sample.textIndex + 1;
    const sampleNum = sample.sampleIndex + 1;
    const sampleName = `${sample.provider}-text${textNum}-sample${sampleNum}`;

    parts.push({
      text: `\n=== AUDIO: ${sampleName} (${sample.textCategory}) ===\n`,
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

/**
 * Legacy function for backward compatibility - single text critique
 */
export async function generateCritiqueSingleText(
  originalText: string,
  samples: AudioSample[]
): Promise<CritiqueReport> {
  const texts = [{ category: "custom", text: originalText }];
  const samplesWithText: AudioSampleWithText[] = samples.map((s) => ({
    ...s,
    textIndex: 0,
    textCategory: "custom",
  }));
  return generateCritique(texts, samplesWithText);
}
