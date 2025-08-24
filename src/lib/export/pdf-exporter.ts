import type { ExportOptions, ExportStrategy } from "./strategy";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export class PdfExporter implements ExportStrategy {
  async export(content: string, options: ExportOptions & { element?: HTMLElement } = {}): Promise<void> {
    const { title = "Document", element } = options;
    if (element) {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${title}.pdf`);
    } else {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const htmlContent = `<html><head><title>${title}</title><style>body { font-family: Arial, sans-serif; margin: 2rem; } @media print { body { margin: 0; } }</style></head><body>${content}</body></html>`;
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }
}

