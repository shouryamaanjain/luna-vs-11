"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CritiqueReport as CritiqueReportType, ProviderAnalysis } from "@/lib/config";

interface CritiqueReportProps {
  report: CritiqueReportType;
}

export function CritiqueReport({ report }: CritiqueReportProps) {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <ScoreComparison
              label="Overall Quality"
              heypixa={report.summary.overallQuality.heypixa}
              elevenlabs={report.summary.overallQuality.elevenlabs}
            />
            <ScoreComparison
              label="Hindi Accuracy"
              heypixa={report.comparison.hindiAccuracy.heypixa}
              elevenlabs={report.comparison.hindiAccuracy.elevenlabs}
            />
            <ScoreComparison
              label="Hinglish Accuracy"
              heypixa={report.comparison.hinglishAccuracy.heypixa}
              elevenlabs={report.comparison.hinglishAccuracy.elevenlabs}
            />
            <ScoreComparison
              label="English Accuracy"
              heypixa={report.comparison.englishAccuracy.heypixa}
              elevenlabs={report.comparison.englishAccuracy.elevenlabs}
            />
            <ScoreComparison
              label="Naturalness"
              heypixa={report.comparison.naturalness.heypixa}
              elevenlabs={report.comparison.naturalness.elevenlabs}
            />
            <ScoreComparison
              label="Consistency"
              heypixa={report.heypixaAnalysis.consistencyScore}
              elevenlabs={report.elevenlabsAnalysis.consistencyScore}
            />
            <ScoreComparison
              label="Emotional Expressiveness"
              heypixa={report.comparison.emotionalExpressiveness?.heypixa ?? 0}
              elevenlabs={report.comparison.emotionalExpressiveness?.elevenlabs ?? 0}
            />
          </div>

          {/* Analysis Reasoning */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Analysis Reasoning</h4>
            <p className="text-sm text-muted-foreground">{report.comparison.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="heypixa">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="heypixa" className="data-[state=active]:bg-emerald-100">
            Pixa Analysis
          </TabsTrigger>
          <TabsTrigger value="elevenlabs" className="data-[state=active]:bg-violet-100">
            ElevenLabs Analysis
          </TabsTrigger>
        </TabsList>
        <TabsContent value="heypixa">
          <ProviderAnalysisCard
            provider="heypixa"
            analysis={report.heypixaAnalysis}
          />
        </TabsContent>
        <TabsContent value="elevenlabs">
          <ProviderAnalysisCard
            provider="elevenlabs"
            analysis={report.elevenlabsAnalysis}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScoreComparison({
  label,
  heypixa,
  elevenlabs,
}: {
  label: string;
  heypixa: number;
  elevenlabs: number;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs w-20 text-emerald-600">Pixa</span>
          <Progress value={heypixa} className="flex-1 h-2" />
          <span className="text-xs w-8 text-right">{heypixa}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-20 text-violet-600">ElevenLabs</span>
          <Progress value={elevenlabs} className="flex-1 h-2" />
          <span className="text-xs w-8 text-right">{elevenlabs}</span>
        </div>
      </div>
    </div>
  );
}

function ProviderAnalysisCard({
  provider,
  analysis,
}: {
  provider: "heypixa" | "elevenlabs";
  analysis: ProviderAnalysis;
}) {
  const color = provider === "heypixa" ? "emerald" : "violet";

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`text-${color}-600`}>
          {provider === "heypixa" ? "Pixa" : "ElevenLabs"} Detailed Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Scores */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <div className={`text-4xl font-bold text-${color}-600`}>
              {analysis.overallScore}
            </div>
            <div className="text-sm text-muted-foreground">Overall Score</div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold text-${color}-600`}>
              {analysis.consistencyScore}
            </div>
            <div className="text-sm text-muted-foreground">Consistency</div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold text-${color}-600`}>
              {analysis.expressivenessScore ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Expressiveness</div>
          </div>
        </div>

        {/* Pronunciation Errors */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            Pronunciation Errors
            <Badge variant="outline">{analysis.pronunciationErrors.length}</Badge>
          </h4>
          {analysis.pronunciationErrors.length > 0 ? (
            <div className="space-y-2">
              {analysis.pronunciationErrors.map((error, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">&ldquo;{error.word}&rdquo;</span>
                    <Badge variant="secondary" className="text-xs">
                      {error.language}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {error.frequency}x
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Expected: {error.expectedPronunciation}
                  </p>
                  <p className="text-muted-foreground">
                    Actual: {error.actualPronunciation}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Samples: {error.sampleIndices.map((i) => i + 1).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pronunciation errors detected</p>
          )}
        </div>

        {/* Accent Issues */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            Accent Issues
            <Badge variant="outline">{analysis.accentIssues.length}</Badge>
          </h4>
          {analysis.accentIssues.length > 0 ? (
            <div className="space-y-2">
              {analysis.accentIssues.map((issue, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">&ldquo;{issue.word}&rdquo;</span>
                    <Badge variant="secondary" className="text-xs">
                      {issue.language}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {issue.frequency}x
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{issue.issue}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Samples: {issue.sampleIndices.map((i) => i + 1).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No accent issues detected</p>
          )}
        </div>

        {/* Audio Artifacts */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            Audio Artifacts
            <Badge variant="outline">{analysis.artifacts.length}</Badge>
          </h4>
          {analysis.artifacts.length > 0 ? (
            <div className="space-y-2">
              {analysis.artifacts.map((artifact, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="text-xs capitalize"
                    >
                      {artifact.type.replace("_", " ")}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      {artifact.frequency}x
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{artifact.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Samples: {artifact.sampleIndices.map((i) => i + 1).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No audio artifacts detected</p>
          )}
        </div>

        {/* Dull Moments (Lack of Expressiveness) */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            Dull Moments
            <Badge variant="outline">{analysis.dullMoments?.length ?? 0}</Badge>
          </h4>
          {analysis.dullMoments && analysis.dullMoments.length > 0 ? (
            <div className="space-y-2">
              {analysis.dullMoments.map((moment, idx) => (
                <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">&ldquo;{moment.text}&rdquo;</span>
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                      Expected: {moment.expectedEmotion}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{moment.issue}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Samples: {moment.sampleIndices.map((i) => i + 1).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dull moments detected - good expressiveness throughout</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
