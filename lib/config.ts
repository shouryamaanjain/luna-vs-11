import type { ElevenLabsModel, TextCategory } from "./database.types";

// API Configuration
export const config = {
  // Pixa TTS
  heypixa: {
    baseUrl: "https://hindi.heypixa.ai/api/v1",
    voice: "neha", // Voice ID for Neha
  },

  // ElevenLabs TTS
  elevenlabs: {
    baseUrl: "https://api.elevenlabs.io/v1",
    voiceId: "gWIZtiCcYnvLguTazwbO", // Devi voice
    defaultModelId: "eleven_turbo_v2_5" as ElevenLabsModel,
    availableModels: [
      { id: "eleven_v3" as ElevenLabsModel, name: "Eleven V3 (Latest)", description: "Latest and most advanced model" },
      { id: "eleven_flash_v2_5" as ElevenLabsModel, name: "Eleven Flash V2.5", description: "Fast generation with good quality" },
      { id: "eleven_turbo_v2_5" as ElevenLabsModel, name: "Eleven Turbo V2.5", description: "Optimized for speed" },
    ],
  },

  // Gemini Models
  gemini: {
    flashModel: "gemini-3-flash-preview", // For text generation
    proModel: "gemini-3-pro-preview", // For critique
  },

  // Sample generation settings
  samples: {
    countPerText: 3, // 3 samples per text per provider
  },

  // Text categories for report generation
  textCategories: [
    { id: "names_places" as TextCategory, name: "Names & Places", description: "Hindi names, cities, and landmarks" },
    { id: "currencies" as TextCategory, name: "Currencies", description: "Money amounts and financial terms" },
    { id: "date_time" as TextCategory, name: "Date & Time", description: "Dates, times, and durations" },
  ],
} as const;

// Types for audio samples
export interface AudioSample {
  id: string;
  provider: "heypixa" | "elevenlabs";
  sampleIndex: number;
  audioBase64: string;
  mimeType: string;
  timestamp: number;
  // Performance metrics
  ttfb: number; // Time to First Byte in milliseconds
  latency: number; // Total request latency in milliseconds
}

export interface CritiqueReport {
  summary: {
    totalSamples: number;
    heypixaSamples: number;
    elevenlabsSamples: number;
    overallQuality: {
      heypixa: number;
      elevenlabs: number;
    };
  };
  heypixaAnalysis: ProviderAnalysis;
  elevenlabsAnalysis: ProviderAnalysis;
  comparison: ComparisonAnalysis;
  rawResponse: string;
}

export interface ProviderAnalysis {
  pronunciationErrors: PronunciationError[];
  accentIssues: AccentIssue[];
  artifacts: AudioArtifact[];
  dullMoments: DullMoment[];
  consistencyScore: number;
  expressivenessScore: number;
  overallScore: number;
}

export interface PronunciationError {
  word: string;
  language: "english" | "hindi" | "hinglish";
  expectedPronunciation: string;
  actualPronunciation: string;
  frequency: number; // How many samples had this error
  sampleIndices: number[];
}

export interface AccentIssue {
  word: string;
  language: "english" | "hindi" | "hinglish";
  issue: string;
  frequency: number;
  sampleIndices: number[];
}

export interface AudioArtifact {
  type: "click" | "pop" | "unnatural_pause" | "distortion" | "other";
  description: string;
  frequency: number;
  sampleIndices: number[];
}

export interface ComparisonAnalysis {
  winner: "heypixa" | "elevenlabs" | "tie";
  reasoning: string;
  hindiAccuracy: {
    heypixa: number;
    elevenlabs: number;
  };
  hinglishAccuracy: {
    heypixa: number;
    elevenlabs: number;
  };
  englishAccuracy: {
    heypixa: number;
    elevenlabs: number;
  };
  naturalness: {
    heypixa: number;
    elevenlabs: number;
  };
  emotionalExpressiveness: {
    heypixa: number;
    elevenlabs: number;
  };
}

export interface DullMoment {
  text: string;
  expectedEmotion: string;
  issue: string;
  sampleIndices: number[];
}
