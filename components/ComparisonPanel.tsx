"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AudioSampleCard } from "./AudioSampleCard";
import { CritiqueReport } from "./CritiqueReport";
import { ModelSelector } from "./ModelSelector";
import { TextCard } from "./TextCard";
import { AudioSample, CritiqueReport as CritiqueReportType, config } from "@/lib/config";
import type { ElevenLabsModel, TextCategory } from "@/lib/database.types";
import { useAuth } from "./AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Plus } from "lucide-react";

type Step = "model-select" | "generating-text" | "text-review" | "generating-audio" | "critiquing" | "complete";

interface TextItem {
  category: TextCategory;
  text: string;
}

interface AudioSampleWithText extends AudioSample {
  textIndex: number;
  textCategory: string;
}

interface ComparisonPanelProps {
  onComplete?: () => void;
}

export function ComparisonPanel({ onComplete }: ComparisonPanelProps) {
  const [step, setStep] = useState<Step>("model-select");
  const [selectedModel, setSelectedModel] = useState<ElevenLabsModel>("eleven_turbo_v2_5");
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [customTextInput, setCustomTextInput] = useState("");
  const [heypixaSamples, setHeypixaSamples] = useState<AudioSampleWithText[]>([]);
  const [elevenlabsSamples, setElevenlabsSamples] = useState<AudioSampleWithText[]>([]);
  const [critiqueReport, setCritiqueReport] = useState<CritiqueReportType | null>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const resetAll = () => {
    setStep("model-select");
    setTexts([]);
    setCustomTextInput("");
    setHeypixaSamples([]);
    setElevenlabsSamples([]);
    setCritiqueReport(null);
    setError("");
    setProgress({ current: 0, total: 0, message: "" });
    setPlayingId(null);
    setReportId(null);
  };

  const generateTexts = async () => {
    setStep("generating-text");
    setError("");
    setProgress({ current: 0, total: 3, message: "Generating category texts..." });

    try {
      const response = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateAll: true }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate texts");
      }

      setTexts(data.texts);
      setProgress({ current: 3, total: 3, message: "All texts generated!" });
      setStep("text-review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("model-select");
    }
  };

  const handleAddCustomText = () => {
    if (!customTextInput.trim()) return;
    setTexts((prev) => [
      ...prev,
      { category: "custom" as TextCategory, text: customTextInput.trim() },
    ]);
    setCustomTextInput("");
  };

  const handleRemoveCustomText = (index: number) => {
    setTexts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextChange = (index: number, newText: string) => {
    setTexts((prev) =>
      prev.map((t, i) => (i === index ? { ...t, text: newText } : t))
    );
  };

  const generateAudio = async () => {
    if (texts.length === 0) {
      setError("Please generate texts first");
      return;
    }

    setStep("generating-audio");
    setError("");
    setHeypixaSamples([]);
    setElevenlabsSamples([]);

    const totalSteps = texts.length * 2;
    let currentStep = 0;

    try {
      const allHeypixaSamples: AudioSampleWithText[] = [];
      const allElevenlabsSamples: AudioSampleWithText[] = [];

      for (let textIndex = 0; textIndex < texts.length; textIndex++) {
        const textItem = texts[textIndex];

        // Generate Pixa samples for this text
        setProgress({
          current: currentStep,
          total: totalSteps,
          message: `Generating Pixa samples for Text ${textIndex + 1} (${textItem.category})...`,
        });

        const heypixaResponse = await fetch("/api/synthesize/heypixa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textItem.text }),
        });
        const heypixaData = await heypixaResponse.json();

        if (!heypixaData.success) {
          throw new Error(heypixaData.error || `Failed to generate Pixa samples for Text ${textIndex + 1}`);
        }

        const heypixaSamplesWithText: AudioSampleWithText[] = heypixaData.samples.map(
          (s: AudioSample) => ({
            ...s,
            textIndex,
            textCategory: textItem.category,
          })
        );
        allHeypixaSamples.push(...heypixaSamplesWithText);
        currentStep++;

        // Generate ElevenLabs samples for this text
        setProgress({
          current: currentStep,
          total: totalSteps,
          message: `Generating ElevenLabs samples for Text ${textIndex + 1} (${textItem.category})...`,
        });

        const elevenlabsResponse = await fetch("/api/synthesize/elevenlabs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textItem.text, modelId: selectedModel }),
        });
        const elevenlabsData = await elevenlabsResponse.json();

        if (!elevenlabsData.success) {
          throw new Error(elevenlabsData.error || `Failed to generate ElevenLabs samples for Text ${textIndex + 1}`);
        }

        const elevenlabsSamplesWithText: AudioSampleWithText[] = elevenlabsData.samples.map(
          (s: AudioSample) => ({
            ...s,
            textIndex,
            textCategory: textItem.category,
          })
        );
        allElevenlabsSamples.push(...elevenlabsSamplesWithText);
        currentStep++;
      }

      setHeypixaSamples(allHeypixaSamples);
      setElevenlabsSamples(allElevenlabsSamples);
      setProgress({ current: totalSteps, total: totalSteps, message: "All audio samples generated!" });
      setStep("text-review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("text-review");
    }
  };

  const generateCritique = async () => {
    if (texts.length === 0 || heypixaSamples.length === 0 || elevenlabsSamples.length === 0) {
      setError("Please generate texts and audio samples first");
      return;
    }

    setStep("critiquing");
    setError("");
    setCritiqueReport(null);
    setProgress({ current: 0, total: 1, message: "Analyzing samples..." });

    try {
      const allSamples = [...heypixaSamples, ...elevenlabsSamples];

      const response = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: texts.map((t) => ({ category: t.category, text: t.text })),
          samples: allSamples,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate critique");
      }

      setCritiqueReport(data.report);
      setProgress({ current: 1, total: 1, message: "Critique complete!" });

      // Save report to Supabase
      if (user) {
        await saveReport(data.report);
      }

      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("text-review");
    }
  };

  const saveReport = async (report: CritiqueReportType) => {
    if (!user) return;

    try {
      // Create report
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          elevenlabs_model: selectedModel,
          status: "completed",
          winner: report.comparison.winner,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      setReportId(reportData.id);

      // Save texts
      const textsToInsert = texts.map((t, i) => ({
        report_id: reportData.id,
        category: t.category,
        text_content: t.text,
        order_index: i,
      }));

      const { data: textsData, error: textsError } = await supabase
        .from("report_texts")
        .insert(textsToInsert)
        .select();

      if (textsError) throw textsError;

      // Save audio samples
      const samplesToInsert = [...heypixaSamples, ...elevenlabsSamples].map((s) => {
        const textRecord = textsData.find((_, i) => i === s.textIndex);
        return {
          report_text_id: textRecord?.id,
          provider: s.provider,
          sample_index: s.sampleIndex,
          audio_base64: s.audioBase64,
          mime_type: s.mimeType,
          ttfb: s.ttfb,
          latency: s.latency,
        };
      });

      const { error: samplesError } = await supabase
        .from("audio_samples")
        .insert(samplesToInsert);

      if (samplesError) throw samplesError;

      // Save critique
      const { error: critiqueError } = await supabase
        .from("critique_results")
        .insert({
          report_id: reportData.id,
          report_json: report as unknown as Record<string, unknown>,
        });

      if (critiqueError) throw critiqueError;

      console.log("Report saved successfully:", reportData.id);
    } catch (err) {
      console.error("Error saving report:", err);
      // Don't show error to user since the critique was still generated successfully
    }
  };

  const handlePlay = useCallback((id: string) => {
    setPlayingId(id);
  }, []);

  const handleStop = useCallback(() => {
    setPlayingId(null);
  }, []);

  const isLoading = step === "generating-text" || step === "generating-audio" || step === "critiquing";
  const hasTexts = texts.length > 0;
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
      {/* Model Selection */}
      {step === "model-select" && (
        <>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isLoading}
          />
          <div className="flex justify-center">
            <Button
              onClick={generateTexts}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              Start: Generate Test Texts
            </Button>
          </div>
        </>
      )}

      {/* Progress Indicator */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>{progress.message}</span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <Progress
              value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
            />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Text Review */}
      {(step === "text-review" || step === "complete") && hasTexts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Texts ({texts.length})</span>
              <Badge variant="outline">
                {config.samples.countPerText} samples per text per provider
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {texts.map((textItem, index) => (
              <TextCard
                key={`${textItem.category}-${index}`}
                category={textItem.category}
                text={textItem.text}
                index={index}
                editable={step === "text-review" && !hasAudio}
                onTextChange={(newText) => handleTextChange(index, newText)}
                onRemove={
                  textItem.category === "custom"
                    ? () => handleRemoveCustomText(index)
                    : undefined
                }
              />
            ))}

            {/* Add Custom Text */}
            {step === "text-review" && !hasAudio && (
              <div className="mt-4 p-4 border-2 border-dashed rounded-lg">
                <h4 className="text-sm font-medium mb-2">Add Custom Text</h4>
                <div className="flex gap-2">
                  <textarea
                    value={customTextInput}
                    onChange={(e) => setCustomTextInput(e.target.value)}
                    className="flex-1 min-h-[80px] p-3 rounded-md border bg-muted/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your own Hindi text in Devanagari..."
                  />
                  <Button
                    onClick={handleAddCustomText}
                    disabled={!customTextInput.trim()}
                    variant="outline"
                    className="self-end"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {step === "text-review" && (
              <div className="flex gap-4 pt-4">
                {!hasAudio ? (
                  <Button
                    onClick={generateAudio}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Generate Audio Samples
                  </Button>
                ) : (
                  <Button
                    onClick={generateCritique}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Generate Critique
                  </Button>
                )}
                <Button onClick={resetAll} variant="outline" disabled={isLoading}>
                  Start Over
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audio Samples Grid */}
      {hasAudio && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pixa Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-emerald-600">Pixa</Badge>
                <span className="text-lg">Samples (Neha)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {texts.map((textItem, textIndex) => {
                  const samplesForText = heypixaSamples.filter(
                    (s) => s.textIndex === textIndex
                  );
                  if (samplesForText.length === 0) return null;
                  return (
                    <div key={`heypixa-text-${textIndex}`}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Text {textIndex + 1}: {textItem.category.replace("_", " ")}
                      </h4>
                      <div className="grid gap-2">
                        {samplesForText.map((sample) => (
                          <AudioSampleCard
                            key={sample.id}
                            sample={sample}
                            isPlaying={playingId === sample.id}
                            onPlay={() => handlePlay(sample.id)}
                            onStop={handleStop}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
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

          {/* ElevenLabs Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-violet-600">ElevenLabs</Badge>
                <span className="text-lg">Samples (Devi)</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {config.elevenlabs.availableModels.find((m) => m.id === selectedModel)?.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {texts.map((textItem, textIndex) => {
                  const samplesForText = elevenlabsSamples.filter(
                    (s) => s.textIndex === textIndex
                  );
                  if (samplesForText.length === 0) return null;
                  return (
                    <div key={`elevenlabs-text-${textIndex}`}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Text {textIndex + 1}: {textItem.category.replace("_", " ")}
                      </h4>
                      <div className="grid gap-2">
                        {samplesForText.map((sample) => (
                          <AudioSampleCard
                            key={sample.id}
                            sample={sample}
                            isPlaying={playingId === sample.id}
                            onPlay={() => handlePlay(sample.id)}
                            onStop={handleStop}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
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
      {critiqueReport && (
        <>
          <CritiqueReport report={critiqueReport} />
          <div className="flex gap-4 justify-center">
            <Button onClick={resetAll} variant="outline">
              Create New Report
            </Button>
            {onComplete && (
              <Button onClick={onComplete} className="bg-emerald-600 hover:bg-emerald-700">
                Back to Dashboard
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
