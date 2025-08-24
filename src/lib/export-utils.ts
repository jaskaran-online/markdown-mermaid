import type { ExportOptions } from "@/lib/export/strategy";
import { HtmlExporter } from "@/lib/export/html-exporter";
import { PdfExporter } from "@/lib/export/pdf-exporter";
import { DocxExporter } from "@/lib/export/docx-exporter";

export class ExportUtils {
  static async exportToMarkdown(content: string, filename: string = "document.md") {
    const blob = new Blob([content], { type: "text/markdown" });
    this.downloadBlob(blob, filename);
  }

  static async exportToHTML(content: string, options: ExportOptions = {}) {
    const exporter = new HtmlExporter();
    await exporter.export(content, options);
  }

  static async exportToPDF(content: string, title: string = "Document", element?: HTMLElement) {
    const exporter = new PdfExporter();
    await exporter.export(content, { title, element });
  }

  static async exportToDOCX(content: string, title: string = "Document", theme: "light" | "dark" = "light") {
    const exporter = new DocxExporter();
    await exporter.export(content, { title, theme });
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

