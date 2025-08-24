import type { ExportOptions, ExportStrategy } from "./strategy";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from "docx";
import { MermaidUtils, MermaidImage } from "@/lib/mermaid-utils";

export class DocxExporter implements ExportStrategy {
  async export(content: string, options: ExportOptions = {}): Promise<void> {
    const { title = "Document", theme = "light" } = options;

    const paragraphs: Paragraph[] = [
      new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
    ];

    let processedContent = content;
    let mermaidImages: MermaidImage[] = [];

    try {
      const result = await MermaidUtils.extractAndConvertMermaidDiagrams(content, theme);
      processedContent = result.content;
      mermaidImages = result.images;
    } catch (error) {
      console.error("Error converting mermaid diagrams:", error);
    }

    const lines = processedContent.split("\n");
    let currentParagraph: TextRun[] = [];

    for (const line of lines) {
      const imageMatch = line.match(/!\[Mermaid Diagram (\d+)\]\(mermaid-diagram-(\d+)\.png\)/);
      if (imageMatch) {
        if (currentParagraph.length > 0) {
          paragraphs.push(new Paragraph({ children: currentParagraph }));
          currentParagraph = [];
        }
        const imageIndex = parseInt(imageMatch[1]) - 1;
        if (mermaidImages[imageIndex]) {
          try {
            const image = mermaidImages[imageIndex];
            const pngDataUrl = await MermaidUtils.svgToPngDataUrl(image.svg, image.width, image.height);
            const base64Data = pngDataUrl.split(",")[1];
            const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: { width: Math.min(image.width, 600), height: Math.min(image.height, 400) },
                    type: "png",
                  }),
                ],
              })
            );
          } catch (error) {
            console.error("Error adding mermaid image to DOCX:", error);
            paragraphs.push(
              new Paragraph({ children: [ new TextRun({ text: `[Mermaid Diagram ${imageMatch[1]} - Image conversion failed]`, italics: true }) ] })
            );
          }
        }
        continue;
      }

      if (line.startsWith("# ")) {
        if (currentParagraph.length > 0) paragraphs.push(new Paragraph({ children: currentParagraph }));
        currentParagraph = [];
        paragraphs.push(new Paragraph({ text: line.substring(2), heading: HeadingLevel.HEADING_1 }));
      } else if (line.startsWith("## ")) {
        if (currentParagraph.length > 0) paragraphs.push(new Paragraph({ children: currentParagraph }));
        currentParagraph = [];
        paragraphs.push(new Paragraph({ text: line.substring(3), heading: HeadingLevel.HEADING_2 }));
      } else if (line.startsWith("### ")) {
        if (currentParagraph.length > 0) paragraphs.push(new Paragraph({ children: currentParagraph }));
        currentParagraph = [];
        paragraphs.push(new Paragraph({ text: line.substring(4), heading: HeadingLevel.HEADING_3 }));
      } else if (line.startsWith("- ")) {
        if (currentParagraph.length > 0) paragraphs.push(new Paragraph({ children: currentParagraph }));
        currentParagraph = [];
        paragraphs.push(new Paragraph({ text: line.substring(2), indent: { left: 720 } }));
      } else if (line.trim() === "") {
        if (currentParagraph.length > 0) {
          paragraphs.push(new Paragraph({ children: currentParagraph }));
          currentParagraph = [];
        }
      } else {
        currentParagraph.push(new TextRun({ text: line + " " }));
      }
    }

    if (currentParagraph.length > 0) paragraphs.push(new Paragraph({ children: currentParagraph }));

    const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    downloadBlob(blob, `${title}.docx`);
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

