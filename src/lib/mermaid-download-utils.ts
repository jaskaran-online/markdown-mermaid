import mermaid from "mermaid";

export interface MermaidDownloadOptions {
  format: "png" | "jpg" | "svg";
  theme: "light" | "dark";
  transparent: boolean;
  width?: number;
  height?: number;
  quality?: number;
}

export class MermaidDownloadUtils {
  /**
   * Download a Mermaid diagram with specified options
   */
  static async downloadMermaidDiagram(
    mermaidCode: string,
    filename: string,
    options: MermaidDownloadOptions
  ): Promise<void> {
    try {
      // Initialize mermaid with the specified theme
      mermaid.initialize({
        startOnLoad: false,
        theme: options.theme === "dark" ? "dark" : "default",
        securityLevel: "loose",
        fontFamily: "monospace",
        fontSize: 14,
        logLevel: 1,
        htmlLabels: true,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
        },
        sequence: {
          useMaxWidth: true,
        },
        er: {
          useMaxWidth: true,
        },
      });

      // Clean the mermaid code
      const cleanCode = mermaidCode
        .trim()
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/<div[^>]*>/g, "")
        .replace(/<\/div>/g, "")
        .replace(/<span[^>]*>/g, "")
        .replace(/<\/span>/g, "");

      // Generate unique ID
      const diagramId = `mermaid-download-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Render the diagram
      const { svg } = await mermaid.render(diagramId, cleanCode);

      // Process SVG based on options
      const processedSvg = this.processSvgForDownload(svg, options);

      // Download based on format
      switch (options.format) {
        case "svg":
          this.downloadSvg(processedSvg, filename);
          break;
        case "png":
          await this.downloadPng(processedSvg, filename, options);
          break;
        case "jpg":
          await this.downloadJpg(processedSvg, filename, options);
          break;
      }
    } catch (error) {
      console.error("Error downloading mermaid diagram:", error);
      throw new Error(
        `Failed to download mermaid diagram: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Process SVG for download based on options
   */
  private static processSvgForDownload(
    svg: string,
    options: MermaidDownloadOptions
  ): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgElement = doc.querySelector("svg");

    if (!svgElement) {
      throw new Error("Invalid SVG content");
    }

    // Set dimensions if provided
    if (options.width) {
      svgElement.setAttribute("width", options.width.toString());
    }
    if (options.height) {
      svgElement.setAttribute("height", options.height.toString());
    }

    // Handle transparency
    if (options.transparent) {
      svgElement.style.backgroundColor = "transparent";
    } else {
      const bgColor = options.theme === "dark" ? "#1a1a1a" : "#ffffff";
      svgElement.style.backgroundColor = bgColor;
    }

    // Ensure viewBox is set for proper scaling
    if (!svgElement.getAttribute("viewBox")) {
      const width = svgElement.getAttribute("width") || "800";
      const height = svgElement.getAttribute("height") || "600";
      svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    return new XMLSerializer().serializeToString(svgElement);
  }

  /**
   * Download SVG file
   */
  private static downloadSvg(svg: string, filename: string): void {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download PNG file
   */
  private static async downloadPng(
    svg: string,
    filename: string,
    options: MermaidDownloadOptions
  ): Promise<void> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Set canvas dimensions
    const width = options.width || 800;
    const height = options.height || 600;
    canvas.width = width;
    canvas.height = height;

    // Set background
    if (!options.transparent) {
      const bgColor = options.theme === "dark" ? "#1a1a1a" : "#ffffff";
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Create image from SVG
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob and download with quality
        const quality = options.quality || 1.0;
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${filename}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              resolve();
            } else {
              reject(new Error("Failed to create PNG blob"));
            }
          },
          "image/png",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load SVG image"));
      img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    });
  }

  /**
   * Download JPG file
   */
  private static async downloadJpg(
    svg: string,
    filename: string,
    options: MermaidDownloadOptions
  ): Promise<void> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Set canvas dimensions
    const width = options.width || 800;
    const height = options.height || 600;
    canvas.width = width;
    canvas.height = height;

    // JPG doesn't support transparency, so always set background
    const bgColor = options.theme === "dark" ? "#1a1a1a" : "#ffffff";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Create image from SVG
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob and download with quality
        const quality = options.quality || 0.9;
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${filename}.jpg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              resolve();
            } else {
              reject(new Error("Failed to create JPG blob"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load SVG image"));
      img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    });
  }

  /**
   * Get default filename from mermaid code
   */
  static getDefaultFilename(mermaidCode: string): string {
    const lines = mermaidCode.trim().split("\n");
    const firstLine = lines[0].trim();

    // Try to extract title from first line
    if (firstLine.startsWith("title")) {
      const titleMatch = firstLine.match(/title\s+(.+)/i);
      if (titleMatch) {
        return titleMatch[1]
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
      }
    }

    // Try to extract from flowchart/graph name
    const graphMatch = mermaidCode.match(/(?:flowchart|graph)\s+(\w+)/i);
    if (graphMatch) {
      return graphMatch[1].toLowerCase();
    }

    // Fallback to timestamp
    return `mermaid-diagram-${Date.now()}`;
  }
}
