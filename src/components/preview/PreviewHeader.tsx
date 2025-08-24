"use client";

import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface PreviewHeaderProps {
  onFullScreen: () => void;
  onExport?: () => void;
}

export function PreviewHeader({ onFullScreen, onExport }: PreviewHeaderProps) {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <h3 className="text-sm font-medium">Preview</h3>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFullScreen}
          className="flex items-center gap-1"
        >
          <Maximize2 className="h-3 w-3" />
          Full Screen
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          Export
        </Button>
      </div>
    </div>
  );
}

