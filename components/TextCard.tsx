"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { config } from "@/lib/config";
import type { TextCategory } from "@/lib/database.types";

interface TextCardProps {
  category: TextCategory;
  text: string;
  index: number;
  editable?: boolean;
  onTextChange?: (text: string) => void;
  onRemove?: () => void;
}

const categoryColors: Record<TextCategory, string> = {
  names_places: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  currencies: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  date_time: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  custom: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function TextCard({
  category,
  text,
  index,
  editable = false,
  onTextChange,
  onRemove,
}: TextCardProps) {
  const categoryInfo = config.textCategories.find((c) => c.id === category);
  const categoryName = categoryInfo?.name || "Custom";
  const categoryDescription = categoryInfo?.description || "User-provided text";

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Text {index + 1}
            </span>
            <Badge className={categoryColors[category]} variant="secondary">
              {categoryName}
            </Badge>
          </div>
          {category === "custom" && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{categoryDescription}</p>
      </CardHeader>
      <CardContent>
        {editable ? (
          <textarea
            value={text}
            onChange={(e) => onTextChange?.(e.target.value)}
            className="w-full min-h-[100px] p-3 rounded-md border bg-muted/50 text-sm font-medium leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter Hindi text in Devanagari..."
          />
        ) : (
          <p className="text-sm font-medium leading-relaxed bg-muted/50 p-3 rounded-md">
            {text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
