"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioSampleCard } from "@/components/AudioSampleCard";
import { CritiqueReport } from "@/components/CritiqueReport";
import { TextCard } from "@/components/TextCard";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { config, AudioSample, CritiqueReport as CritiqueReportType } from "@/lib/config";
import type { Report, ReportText, AudioSampleDB, TextCategory } from "@/lib/database.types";
import { ArrowLeft, Trash2 } from "lucide-react";

interface ReportData {
  report: Report;
  texts: ReportText[];
  samples: AudioSampleDB[];
  critique: CritiqueReportType | null;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchReport = async () => {
      if (!params.id) return;

      try {
        // Fetch report
        const { data: report, error: reportError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", params.id)
          .single();

        if (reportError) throw reportError;

        // Fetch texts
        const { data: texts, error: textsError } = await supabase
          .from("report_texts")
          .select("*")
          .eq("report_id", params.id)
          .order("order_index");

        if (textsError) throw textsError;

        // Fetch samples
        const textIds = texts.map((t) => t.id);
        const { data: samples, error: samplesError } = await supabase
          .from("audio_samples")
          .select("*")
          .in("report_text_id", textIds);

        if (samplesError) throw samplesError;

        // Fetch critique
        const { data: critiqueData, error: critiqueError } = await supabase
          .from("critique_results")
          .select("*")
          .eq("report_id", params.id)
          .single();

        // Critique might not exist yet
        const critique = critiqueError ? null : (critiqueData?.report_json as unknown as CritiqueReportType);

        setData({ report, texts, samples, critique });
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [params.id, supabase]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", params.id);

      if (error) throw error;
      router.push("/dashboard");
    } catch (err) {
      console.error("Error deleting report:", err);
      alert("Failed to delete report");
    }
  };

  const handlePlay = useCallback((id: string) => {
    setPlayingId(id);
  }, []);

  const handleStop = useCallback(() => {
    setPlayingId(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Report not found"}</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { report, texts, samples, critique } = data;

  // Group samples by text and provider
  const getSamplesForText = (textId: string, provider: "heypixa" | "elevenlabs") => {
    return samples
      .filter((s) => s.report_text_id === textId && s.provider === provider)
      .sort((a, b) => a.sample_index - b.sample_index);
  };

  // Convert DB sample to AudioSample format
  const toAudioSample = (dbSample: AudioSampleDB): AudioSample => ({
    id: dbSample.id,
    provider: dbSample.provider as "heypixa" | "elevenlabs",
    sampleIndex: dbSample.sample_index,
    audioBase64: dbSample.audio_base64,
    mimeType: dbSample.mime_type,
    timestamp: Date.now(),
    ttfb: dbSample.ttfb || 0,
    latency: dbSample.latency || 0,
  });

  const getModelName = (modelId: string) => {
    const model = config.elevenlabs.availableModels.find((m) => m.id === modelId);
    return model?.name || modelId;
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  Report - {new Date(report.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    Model: {getModelName(report.elevenlabs_model)}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Texts */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Texts ({texts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {texts.map((text, index) => (
              <TextCard
                key={text.id}
                category={text.category as TextCategory}
                text={text.text_content}
                index={index}
                editable={false}
              />
            ))}
          </CardContent>
        </Card>

        {/* Audio Samples */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pixa Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-emerald-600">Pixa</Badge>
                <span className="text-lg">Samples (Neha)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {texts.map((text, textIndex) => {
                const textSamples = getSamplesForText(text.id, "heypixa");
                if (textSamples.length === 0) return null;
                return (
                  <div key={`heypixa-${text.id}`}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Text {textIndex + 1}: {text.category.replace("_", " ")}
                    </h4>
                    <div className="grid gap-2">
                      {textSamples.map((sample) => (
                        <AudioSampleCard
                          key={sample.id}
                          sample={toAudioSample(sample)}
                          isPlaying={playingId === sample.id}
                          onPlay={() => handlePlay(sample.id)}
                          onStop={handleStop}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* ElevenLabs Samples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-violet-600">ElevenLabs</Badge>
                <span className="text-lg">Samples (Devi)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {texts.map((text, textIndex) => {
                const textSamples = getSamplesForText(text.id, "elevenlabs");
                if (textSamples.length === 0) return null;
                return (
                  <div key={`elevenlabs-${text.id}`}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Text {textIndex + 1}: {text.category.replace("_", " ")}
                    </h4>
                    <div className="grid gap-2">
                      {textSamples.map((sample) => (
                        <AudioSampleCard
                          key={sample.id}
                          sample={toAudioSample(sample)}
                          isPlaying={playingId === sample.id}
                          onPlay={() => handlePlay(sample.id)}
                          onStop={handleStop}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Critique Report */}
        {critique && <CritiqueReport report={critique} />}
      </div>
    </main>
  );
}
