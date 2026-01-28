"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AudioSampleCard } from "./AudioSampleCard";
import { CritiqueReport } from "./CritiqueReport";
import { AudioSample, CritiqueReport as CritiqueReportType } from "@/lib/config";

type Step = "idle" | "generating-text" | "generating-audio" | "critiquing" | "complete";

export function ComparisonPanel() {
  const [step, setStep] = useState<Step>("idle");
  const [text, setText] = useState<string>("");
  const [heypixaSamples, setHeypixaSamples] = useState<AudioSample[]>([]);
  const [elevenlabsSamples, setElevenlabsSamples] = useState<AudioSample[]>([]);
  const [critiqueReport, setCritiqueReport] = useState<CritiqueReportType | null>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [playingId, setPlayingId] = useState<string | null>(null);

  const resetAll = () => {
    setStep("idle");
    setText("");
    setHeypixaSamples([]);
    setElevenlabsSamples([]);
    setCritiqueReport(null);
    setError("");
    setProgress({ current: 0, total: 0, message: "" });
    setPlayingId(null);
  };

  const generateText = async () => {
    setStep("generating-text");
    setError("");
    setProgress({ current: 0, total: 1, message: "Generating challenging text with Gemini..." });

    try {
      const response = await fetch("/api/generate-text", { method: "POST" });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate text");
      }

      setText(data.text);
      setProgress({ current: 1, total: 1, message: "Text generated!" });
      setStep("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("idle");
    }
  };

  const generateAudio = async () => {
    if (!text) {
      setError("Please generate text first");
      return;
    }

    setStep("generating-audio");
    setError("");
    setHeypixaSamples([]);
    setElevenlabsSamples([]);
    setProgress({ current: 0, total: 2, message: "Generating ElevenLabs samples..." });

    try {
      // Generate ElevenLabs samples
      const heypixaResponse = await fetch("/api/synthesize/heypixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const heypixaData = await heypixaResponse.json();

      if (!heypixaData.success) {
        throw new Error(heypixaData.error || "Failed to generate ElevenLabs samples");
      }

      setHeypixaSamples(heypixaData.samples);
      setProgress({ current: 1, total: 2, message: "Generating Pixa samples..." });

      // Generate Pixa samples
      const elevenlabsResponse = await fetch("/api/synthesize/elevenlabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const elevenlabsData = await elevenlabsResponse.json();

      if (!elevenlabsData.success) {
        throw new Error(elevenlabsData.error || "Failed to generate Pixa samples");
      }

      setElevenlabsSamples(elevenlabsData.samples);
      setProgress({ current: 2, total: 2, message: "All audio samples generated!" });
      setStep("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("idle");
    }
  };

  const generateCritique = async () => {
    if (!text || heypixaSamples.length === 0 || elevenlabsSamples.length === 0) {
      setError("Please generate text and audio samples first");
      return;
    }

    setStep("critiquing");
    setError("");
    setCritiqueReport(null);
    setProgress({ current: 0, total: 1, message: "Analyzing samples with Gemini Pro..." });

    try {
      const allSamples = [...heypixaSamples, ...elevenlabsSamples];
      
      const response = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, samples: allSamples }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate critique");
      }

      setCritiqueReport(data.report);
      setProgress({ current: 1, total: 1, message: "Critique complete!" });
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("idle");
    }
  };

  const handlePlay = useCallback((id: string) => {
    setPlayingId(id);
  }, []);

  const handleStop = useCallback(() => {
    setPlayingId(null);
  }, []);

  const isLoading = step !== "idle" && step !== "complete";
  const hasText = text.length > 0;
  const hasAudio = heypixaSamples.length > 0 && elevenlabsSamples.length > 0;

  // Calculate average metrics for each provider
  const calculateAverages = (samples: AudioSample[]) => {
    if (samples.length === 0) return { avgTtfb: 0, avgLatency: 0 };
    const totalTtfb = samples.reduce((sum, s) => sum + s.ttfb, 0);
    const totalLatency = samples.reduce((sum, s) => sum + s.latency, 0);
    return {
      avgTtfb: Math.round(totalTtfb / samples.length),
      avgLatency: Math.round(totalLatency / samples.length),
    };
  };

  const heypixaAverages = calculateAverages(heypixaSamples);
  const elevenlabsAverages = calculateAverages(elevenlabsSamples);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>TTS Comparison Pipeline</span>
            {step !== "idle" && (
              <Badge variant="secondary" className="animate-pulse">
                {step.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          {isLoading && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span>{progress.message}</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress
                value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={generateText}
              disabled={isLoading}
              variant={hasText ? "outline" : "default"}
            >
              {hasText ? "Regenerate Text" : "1. Generate Text"}
            </Button>
            <Button
              onClick={generateAudio}
              disabled={isLoading || !hasText}
              variant={hasAudio ? "outline" : "default"}
            >
              {hasAudio ? "Regenerate Audio" : "2. Generate Audio Samples"}
            </Button>
            <Button
              onClick={generateCritique}
              disabled={isLoading || !hasAudio}
              variant={critiqueReport ? "outline" : "default"}
            >
              {critiqueReport ? "Regenerate Critique" : "3. Generate Critique"}
            </Button>
            <Button onClick={resetAll} variant="destructive" disabled={isLoading}>
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Text */}
      {hasText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generated Text Sample</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 bg-muted rounded-lg font-medium text-lg leading-relaxed min-h-[120px] resize-y border-0 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Generated text will appear here..."
            />
          </CardContent>
        </Card>
      )}

      {/* Audio Samples Grid */}
      {hasAudio && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* ElevenLabs Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-emerald-600">ElevenLabs</Badge>
                <span className="text-lg">Samples (Devi)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {heypixaSamples.map((sample) => (
                  <AudioSampleCard
                    key={sample.id}
                    sample={sample}
                    isPlaying={playingId === sample.id}
                    onPlay={() => handlePlay(sample.id)}
                    onStop={handleStop}
                  />
                ))}
              </div>
              {/* Average Metrics */}
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                  Average Performance ({heypixaSamples.length} samples)
                </h4>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg TTFB:</span>{" "}
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {heypixaAverages.avgTtfb}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Latency:</span>{" "}
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {heypixaAverages.avgLatency}ms
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pixa Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-violet-600">Pixa</Badge>
                <span className="text-lg">Samples (Neha)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {elevenlabsSamples.map((sample) => (
                  <AudioSampleCard
                    key={sample.id}
                    sample={sample}
                    isPlaying={playingId === sample.id}
                    onPlay={() => handlePlay(sample.id)}
                    onStop={handleStop}
                  />
                ))}
              </div>
              {/* Average Metrics */}
              <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
                <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-2">
                  Average Performance ({elevenlabsSamples.length} samples)
                </h4>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg TTFB:</span>{" "}
                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                      {elevenlabsAverages.avgTtfb}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Latency:</span>{" "}
                    <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                      {elevenlabsAverages.avgLatency}ms
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critique Report */}
      {critiqueReport && <CritiqueReport report={critiqueReport} />}
    </div>
  );
}
