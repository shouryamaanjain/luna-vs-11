import { config, AudioSample } from "./config";

/**
 * Synthesize speech using Pixa TTS API
 * Based on docs: POST https://hindi.heypixa.ai/api/v1/synthesize
 */
export async function synthesizeHeyPixa(
  text: string,
  sampleIndex: number
): Promise<AudioSample> {
  const url = `${config.heypixa.baseUrl}/synthesize`;

  const startTime = performance.now();
  let ttfb = 0;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      voice: config.heypixa.voice,
    }),
  });

  // Record TTFB - time when we got the response headers
  ttfb = performance.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Pixa synthesis failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Get the audio data as ArrayBuffer
  const audioBuffer = await response.arrayBuffer();

  // Record total latency - time when we got all the data
  const latency = performance.now() - startTime;

  // Convert to base64
  const base64 = Buffer.from(audioBuffer).toString("base64");

  // Determine mime type from content-type header or default to wav
  const contentType = response.headers.get("content-type") || "audio/wav";

  return {
    id: `heypixa-${sampleIndex}-${Date.now()}`,
    provider: "heypixa",
    sampleIndex,
    audioBase64: base64,
    mimeType: contentType.split(";")[0], // Remove charset if present
    timestamp: Date.now(),
    ttfb: Math.round(ttfb),
    latency: Math.round(latency),
  };
}

// Legacy alias for backward compatibility (old code used wrong name)
export const synthesizeElevenLabs = synthesizeHeyPixa;

/**
 * Generate multiple samples from Pixa
 */
export async function generateHeyPixaSamples(
  text: string,
  count: number = config.samples.countPerText
): Promise<AudioSample[]> {
  const samples: AudioSample[] = [];

  for (let i = 0; i < count; i++) {
    try {
      // Add a small delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      const sample = await synthesizeHeyPixa(text, i);
      samples.push(sample);
    } catch (error) {
      console.error(`Failed to generate Pixa sample ${i}:`, error);
      throw error;
    }
  }

  return samples;
}

// Legacy alias for backward compatibility
export const generateElevenLabsSamples = generateHeyPixaSamples;

/**
 * Get available voices from Pixa config endpoint
 */
export async function getHeyPixaConfig(): Promise<{
  voices: Array<{ id: string; name: string; description: string; available: boolean }>;
  default_voice: string;
  sample_rate: number;
}> {
  const url = `${config.heypixa.baseUrl}/config`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get Pixa config: ${response.status}`);
  }

  return response.json();
}

// Legacy alias for backward compatibility
export const getElevenLabsConfig = getHeyPixaConfig;
