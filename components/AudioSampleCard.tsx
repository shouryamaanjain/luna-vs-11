"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioSample } from "@/lib/config";

interface AudioSampleCardProps {
  sample: AudioSample;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function AudioSampleCard({
  sample,
  isPlaying,
  onPlay,
  onStop,
}: AudioSampleCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    // Create audio element with base64 data
    const audio = new Audio(`data:${sample.mimeType};base64,${sample.audioBase64}`);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      onStop();
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [sample, onStop]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle progress bar click for seeking
  const handleProgressBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !progressBarRef.current || duration === 0) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;

      audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
      setCurrentTime(audioRef.current.currentTime);
    },
    [duration]
  );

  // Handle download
  const handleDownload = useCallback(() => {
    const extension = sample.mimeType.includes("wav") ? "wav" : "mp3";
    const filename = `${sample.provider}-sample-${sample.sampleIndex + 1}.${extension}`;

    // Convert base64 to blob
    const byteCharacters = atob(sample.audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: sample.mimeType });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sample]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge
            variant={sample.provider === "heypixa" ? "default" : "secondary"}
            className={
              sample.provider === "heypixa"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }
          >
            {sample.provider === "heypixa" ? "ElevenLabs" : "Pixa"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Sample #{sample.sampleIndex + 1}
          </span>
        </div>

        {/* Performance Metrics */}
        <div className="flex gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">TTFB:</span>
            <span className="font-mono font-medium">{sample.ttfb}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Latency:</span>
            <span className="font-mono font-medium">{sample.latency}ms</span>
          </div>
        </div>

        {/* Progress bar - clickable for seeking */}
        <div
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="h-2 bg-muted rounded-full mb-3 overflow-hidden cursor-pointer hover:h-2.5 transition-all group"
          title="Click to seek"
        >
          <div
            className={`h-full transition-all duration-100 ${
              sample.provider === "heypixa" ? "bg-emerald-500" : "bg-violet-500"
            } group-hover:opacity-90`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlaying ? "destructive" : "outline"}
              onClick={isPlaying ? onStop : onPlay}
              className="min-w-[80px]"
            >
              {isPlaying ? (
                <>
                  <StopIcon className="w-4 h-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4 mr-1" />
                  Play
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              title="Download audio"
            >
              <DownloadIcon className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
