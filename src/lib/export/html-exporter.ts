import type { ExportOptions, ExportStrategy } from "./strategy";
import { MermaidUtils, MermaidImage } from "@/lib/mermaid-utils";

export class HtmlExporter implements ExportStrategy {
  async export(content: string, options: ExportOptions = {}): Promise<void> {
    const { title = "Document", theme = "light" } = options;

    // Convert Mermaid diagrams to images for HTML export
    let processedContent = content;
    let mermaidImages: MermaidImage[] = [];

    try {
      const result = await MermaidUtils.extractAndConvertMermaidDiagrams(content, theme);
      processedContent = result.content;
      mermaidImages = result.images;
    } catch (error) {
      console.error("Error converting mermaid diagrams for HTML:", error);
    }

    // Replace image placeholders with actual image data URLs
    let finalContent = processedContent;
    mermaidImages.forEach((image, index) => {
      const placeholder = `![Mermaid Diagram ${index + 1}](mermaid-diagram-${index + 1}.png)`;
      const imageTag = `<img src="${image.dataUrl}" alt="Mermaid Diagram ${index + 1}" style="max-width: 100%; height: auto; display: block; margin: 1rem auto;" />`;
      finalContent = finalContent.replace(placeholder, imageTag);
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; background: ${theme === "dark" ? "#1a1a1a" : "#ffffff"}; color: ${theme === "dark" ? "#ffffff" : "#000000"}; }
    h1,h2,h3,h4,h5,h6 { margin-top: 2rem; margin-bottom: 1rem; }
    code { background: ${theme === "dark" ? "#2d2d2d" : "#f5f5f5"}; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: 'Monaco','Menlo',monospace; }
    pre { background: ${theme === "dark" ? "#2d2d2d" : "#f5f5f5"}; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid ${theme === "dark" ? "#555" : "#ddd"}; margin: 1rem 0; padding-left: 1rem; color: ${theme === "dark" ? "#ccc" : "#666"}; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th,td { border: 1px solid ${theme === "dark" ? "#555" : "#ddd"}; padding: 0.5rem; text-align: left; }
    th { background: ${theme === "dark" ? "#333" : "#f5f5f5"}; }
    img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  ${finalContent}
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    downloadBlob(blob, `${title}.html`);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

