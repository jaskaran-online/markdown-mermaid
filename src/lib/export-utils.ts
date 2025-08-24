import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export interface ExportOptions {
  title?: string
  includeTOC?: boolean
  theme?: 'light' | 'dark'
}

export class ExportUtils {
  static async exportToMarkdown(content: string, filename: string = 'document.md') {
    const blob = new Blob([content], { type: 'text/markdown' })
    this.downloadBlob(blob, filename)
  }

  static async exportToHTML(
    content: string,
    options: ExportOptions = {}
  ) {
    const { title = 'Document', theme = 'light' } = options

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
            color: ${theme === 'dark' ? '#ffffff' : '#000000'};
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: ${theme === 'dark' ? '#ffffff' : '#000000'};
        }
        code {
            background: ${theme === 'dark' ? '#2d2d2d' : '#f5f5f5'};
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        pre {
            background: ${theme === 'dark' ? '#2d2d2d' : '#f5f5f5'};
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid ${theme === 'dark' ? '#555' : '#ddd'};
            margin: 1rem 0;
            padding-left: 1rem;
            color: ${theme === 'dark' ? '#ccc' : '#666'};
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        th, td {
            border: 1px solid ${theme === 'dark' ? '#555' : '#ddd'};
            padding: 0.5rem;
            text-align: left;
        }
        th {
            background: ${theme === 'dark' ? '#333' : '#f5f5f5'};
        }
        .mermaid {
            background: ${theme === 'dark' ? '#2d2d2d' : '#f9f9f9'};
            border: 1px solid ${theme === 'dark' ? '#555' : '#ddd'};
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            text-align: center;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    this.downloadBlob(blob, `${title}.html`)
  }

  static async exportToPDF(
    content: string,
    title: string = 'Document',
    element?: HTMLElement
  ) {
    if (element) {
      // Use html2canvas + jsPDF for better control
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${title}.pdf`)
    } else {
      // Fallback to browser print
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const htmlContent = `
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 2rem; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `
        printWindow.document.open()
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  static async exportToDOCX(
    content: string,
    title: string = 'Document'
  ) {
    const paragraphs: Paragraph[] = []

    // Add title
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
      })
    )

    // Simple content processing - in a real app, you'd use a more sophisticated parser
    const lines = content.split('\n')
    let currentParagraph: TextRun[] = []

    for (const line of lines) {
      if (line.startsWith('# ')) {
        if (currentParagraph.length > 0) {
          paragraphs.push(new Paragraph({ children: currentParagraph }))
          currentParagraph = []
        }
        paragraphs.push(
          new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
          })
        )
      } else if (line.startsWith('## ')) {
        if (currentParagraph.length > 0) {
          paragraphs.push(new Paragraph({ children: currentParagraph }))
          currentParagraph = []
        }
        paragraphs.push(
          new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
          })
        )
      } else if (line.startsWith('### ')) {
        if (currentParagraph.length > 0) {
          paragraphs.push(new Paragraph({ children: currentParagraph }))
          currentParagraph = []
        }
        paragraphs.push(
          new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3,
          })
        )
      } else if (line.startsWith('- ')) {
        if (currentParagraph.length > 0) {
          paragraphs.push(new Paragraph({ children: currentParagraph }))
          currentParagraph = []
        }
        paragraphs.push(
          new Paragraph({
            text: line.substring(2),
            indent: { left: 720 }, // 0.5 inch indent
          })
        )
      } else if (line.trim() === '') {
        if (currentParagraph.length > 0) {
          paragraphs.push(new Paragraph({ children: currentParagraph }))
          currentParagraph = []
        }
      } else {
        // Regular paragraph text
        const textRun = new TextRun({
          text: line + ' ',
          bold: line.includes('**'),
          italics: line.includes('*') && !line.includes('**'),
        })
        currentParagraph.push(textRun)
      }
    }

    // Add remaining content
    if (currentParagraph.length > 0) {
      paragraphs.push(new Paragraph({ children: currentParagraph }))
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const blob = new Blob([new Uint8Array(buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    this.downloadBlob(blob, `${title}.docx`)
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static extractMermaidDiagrams(content: string): string[] {
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g
    const diagrams: string[] = []
    let match

    while ((match = mermaidRegex.exec(content)) !== null) {
      diagrams.push(match[1])
    }

    return diagrams
  }
}