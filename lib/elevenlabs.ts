import { config, AudioSample } from "./config";

/**
 * Synthesize speech using ElevenLabs TTS API
 * Based on docs: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
 */
export async function synthesizePixa(
  text: string,
  sampleIndex: number
): Promise<AudioSample> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set in environment variables");
  }

  const url = `${config.elevenlabs.baseUrl}/text-to-speech/${config.elevenlabs.voiceId}`;

  const startTime = performance.now();
  let ttfb = 0;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: config.elevenlabs.modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  // Record TTFB - time when we got the response headers
  ttfb = performance.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs synthesis failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Get the audio data as ArrayBuffer
  const audioBuffer = await response.arrayBuffer();

  // Record total latency - time when we got all the data
  const latency = performance.now() - startTime;

  // Convert to base64
  const base64 = Buffer.from(audioBuffer).toString("base64");

  // ElevenLabs returns MP3 by default
  const contentType = response.headers.get("content-type") || "audio/mpeg";

  return {
    id: `elevenlabs-${sampleIndex}-${Date.now()}`,
    provider: "elevenlabs",
    sampleIndex,
    audioBase64: base64,
    mimeType: contentType.split(";")[0],
    timestamp: Date.now(),
    ttfb: Math.round(ttfb),
    latency: Math.round(latency),
  };
}

/**
 * Generate multiple samples from ElevenLabs with retry logic
 */
export async function generatePixaSamples(
  text: string,
  count: number = config.samples.countPerProvider
): Promise<AudioSample[]> {
  const samples: AudioSample[] = [];
  const maxRetries = 3;

  for (let i = 0; i < count; i++) {
    let lastError: Error | null = null;

    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        // Add delay between requests to avoid rate limiting
        if (i > 0 || retry > 0) {
          const delay = retry > 0 ? 2000 * (retry + 1) : 500; // Exponential backoff on retry
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const sample = await synthesizePixa(text, i);
        samples.push(sample);
        lastError = null;
        break;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `Failed to generate ElevenLabs sample ${i} (attempt ${retry + 1}):`,
          error
        );

        // If it's a rate limit error (429), wait longer
        if (error instanceof Error && error.message.includes("429")) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  return samples;
}

/**
 * Get voice information from ElevenLabs
 */
export async function getPixaVoice(): Promise<{
  voice_id: string;
  name: string;
  labels: Record<string, string>;
}> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set in environment variables");
  }

  const url = `${config.elevenlabs.baseUrl}/voices/${config.elevenlabs.voiceId}`;

  const response = await fetch(url, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get ElevenLabs voice: ${response.status}`);
  }

  return response.json();
}
