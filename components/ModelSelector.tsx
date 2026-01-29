"use client";

import { config } from "@/lib/config";
import type { ElevenLabsModel } from "@/lib/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModelSelectorProps {
  selectedModel: ElevenLabsModel;
  onModelChange: (model: ElevenLabsModel) => void;
  disabled?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Select ElevenLabs Model</CardTitle>
        <CardDescription>
          Choose which ElevenLabs model to use for audio generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {config.elevenlabs.availableModels.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => onModelChange(model.id)}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedModel === model.id
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="font-medium text-sm">{model.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {model.description}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
