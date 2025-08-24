"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  MermaidDownloadUtils,
  MermaidDownloadOptions,
} from "@/lib/mermaid-download-utils";
import {
  Download,
  FileImage,
  FileType,
  Palette,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from "lucide-react";

interface MermaidDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mermaidCode: string;
  diagramTitle?: string;
}

export function MermaidDownloadModal({
  isOpen,
  onClose,
  mermaidCode,
  diagramTitle,
}: MermaidDownloadModalProps) {
  const [downloadOptions, setDownloadOptions] =
    useState<MermaidDownloadOptions>({
      format: "png",
      theme: "light",
      transparent: false,
      width: 800,
      height: 600,
      quality: 0.9,
    });
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filename =
        diagramTitle || MermaidDownloadUtils.getDefaultFilename(mermaidCode);
      await MermaidDownloadUtils.downloadMermaidDiagram(
        mermaidCode,
        filename,
        downloadOptions
      );
      onClose();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download diagram. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatOptions = [
    {
      value: "png",
      label: "PNG",
      icon: FileImage,
      description: "High quality, supports transparency",
    },
    {
      value: "jpg",
      label: "JPG",
      icon: FileImage,
      description: "Smaller file size, no transparency",
    },
    {
      value: "svg",
      label: "SVG",
      icon: FileType,
      description: "Vector format, scalable",
    },
  ];

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  // Preset configurations for common use cases
  const presetConfigs = [
    {
      name: "Web",
      description: "Standard web resolution",
      config: { width: 800, height: 600, quality: 0.8 },
    },
    {
      name: "HD",
      description: "High definition",
      config: { width: 1920, height: 1080, quality: 0.9 },
    },
    {
      name: "Print",
      description: "Print quality",
      config: { width: 2400, height: 1800, quality: 1.0 },
    },
    {
      name: "Mobile",
      description: "Mobile optimized",
      config: { width: 400, height: 300, quality: 0.7 },
    },
    {
      name: "Social",
      description: "Social media",
      config: { width: 1200, height: 630, quality: 0.85 },
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download Mermaid Diagram"
      size="md"
    >
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FileType className="h-4 w-4" />
            Format
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {formatOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  downloadOptions.format === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={downloadOptions.format === option.value}
                  onChange={(e) =>
                    setDownloadOptions({
                      ...downloadOptions,
                      format: e.target.value as any,
                    })
                  }
                  className="sr-only"
                />
                <option.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {themeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  downloadOptions.theme === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={downloadOptions.theme === option.value}
                  onChange={(e) =>
                    setDownloadOptions({
                      ...downloadOptions,
                      theme: e.target.value as any,
                    })
                  }
                  className="sr-only"
                />
                <option.icon className="h-4 w-4" />
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Background Options */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            {downloadOptions.transparent ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Background
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                !downloadOptions.transparent
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="background"
                checked={!downloadOptions.transparent}
                onChange={() =>
                  setDownloadOptions({ ...downloadOptions, transparent: false })
                }
                className="sr-only"
              />
              <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white"></div>
              <span className="font-medium">With Background</span>
            </label>
            <label
              className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                downloadOptions.transparent
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="background"
                checked={downloadOptions.transparent}
                onChange={() =>
                  setDownloadOptions({ ...downloadOptions, transparent: true })
                }
                className="sr-only"
              />
              <div className="w-4 h-4 rounded border-2 border-gray-300 bg-transparent"></div>
              <span className="font-medium">Transparent</span>
            </label>
          </div>
          {downloadOptions.format === "jpg" && downloadOptions.transparent && (
            <p className="text-xs text-muted-foreground mt-2">
              Note: JPG format doesn't support transparency. Will use background
              color.
            </p>
          )}
        </div>

        {/* Preset Configurations */}
        <div>
          <h3 className="text-sm font-medium mb-3">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {presetConfigs.map((preset) => (
              <button
                key={preset.name}
                onClick={() =>
                  setDownloadOptions({
                    ...downloadOptions,
                    ...preset.config,
                  })
                }
                className="p-3 border border-border rounded-lg text-left hover:border-primary/50 transition-colors"
              >
                <div className="font-medium text-sm">{preset.name}</div>
                <div className="text-xs text-muted-foreground">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Control */}
        {(downloadOptions.format === "png" ||
          downloadOptions.format === "jpg") && (
          <div>
            <h3 className="text-sm font-medium mb-3">Quality</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quality</span>
                <span className="text-sm font-medium">
                  {Math.round((downloadOptions.quality || 0.9) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={downloadOptions.quality || 0.9}
                onChange={(e) =>
                  setDownloadOptions({
                    ...downloadOptions,
                    quality: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        )}

        {/* Dimensions */}
        <div>
          <h3 className="text-sm font-medium mb-3">Dimensions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Width (px)
              </label>
              <input
                type="number"
                value={downloadOptions.width}
                onChange={(e) =>
                  setDownloadOptions({
                    ...downloadOptions,
                    width: parseInt(e.target.value) || 800,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                min="100"
                max="3000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Height (px)
              </label>
              <input
                type="number"
                value={downloadOptions.height}
                onChange={(e) =>
                  setDownloadOptions({
                    ...downloadOptions,
                    height: parseInt(e.target.value) || 600,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                min="100"
                max="3000"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
