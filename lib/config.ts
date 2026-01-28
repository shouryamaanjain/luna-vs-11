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
    modelId: "eleven_turbo_v2_5",
  },

  // Gemini Models
  gemini: {
    flashModel: "gemini-3-flash-preview", // For text generation
    proModel: "gemini-3-pro-preview", // For critique
  },

  // Sample generation settings
  samples: {
    countPerProvider: 10, // 10 samples each from Pixa and ElevenLabs
  },
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
