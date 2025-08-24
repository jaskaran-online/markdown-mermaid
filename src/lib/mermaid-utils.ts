import mermaid from 'mermaid';

export interface MermaidImage {
  id: string;
  svg: string;
  dataUrl: string;
  width: number;
  height: number;
}

export class MermaidUtils {
  /**
   * Convert Mermaid diagram code to SVG and then to data URL
   */
  static async convertMermaidToImage(
    mermaidCode: string,
    theme: 'light' | 'dark' = 'light'
  ): Promise<MermaidImage> {
    try {
      // Initialize mermaid with the specified theme
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'monospace',
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
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/<div[^>]*>/g, '')
        .replace(/<\/div>/g, '')
        .replace(/<span[^>]*>/g, '')
        .replace(/<\/span>/g, '');

      // Generate unique ID
      const diagramId = `mermaid-export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Render the diagram
      const { svg } = await mermaid.render(diagramId, cleanCode);

      // Convert SVG to data URL
      const dataUrl = await this.svgToDataUrl(svg);

      // Get dimensions from SVG
      const dimensions = this.extractSvgDimensions(svg);

      return {
        id: diagramId,
        svg,
        dataUrl,
        width: dimensions.width,
        height: dimensions.height,
      };
    } catch (error) {
      console.error('Error converting mermaid to image:', error);
      throw new Error(`Failed to convert mermaid diagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert SVG string to data URL
   */
  private static async svgToDataUrl(svg: string): Promise<string> {
    // Create a blob from the SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    
    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Extract width and height from SVG
   */
  private static extractSvgDimensions(svg: string): { width: number; height: number } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (svgElement) {
      const width = parseInt(svgElement.getAttribute('width') || '800');
      const height = parseInt(svgElement.getAttribute('height') || '600');
      return { width, height };
    }
    
    return { width: 800, height: 600 }; // Default dimensions
  }

  /**
   * Convert SVG to PNG data URL (for better compatibility with DOC)
   */
  static async svgToPngDataUrl(svg: string, width: number = 800, height: number = 600): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = width;
      canvas.height = height;

      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        // Draw white background for light theme
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Draw the SVG
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load SVG image'));
      img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    });
  }

  /**
   * Extract all Mermaid diagrams from content and convert them to images
   */
  static async extractAndConvertMermaidDiagrams(
    content: string,
    theme: 'light' | 'dark' = 'light'
  ): Promise<{ content: string; images: MermaidImage[] }> {
    const mermaidRegex = /```mermaid\s*\n([\s\S]*?)\n```/g;
    const images: MermaidImage[] = [];
    let processedContent = content;
    let match;
    let counter = 0;

    while ((match = mermaidRegex.exec(content)) !== null) {
      try {
        const mermaidCode = match[1];
        const image = await this.convertMermaidToImage(mermaidCode, theme);
        images.push(image);
        
        // Replace mermaid block with image placeholder
        const placeholder = `![Mermaid Diagram ${counter + 1}](mermaid-diagram-${counter + 1}.png)`;
        processedContent = processedContent.replace(match[0], placeholder);
        counter++;
      } catch (error) {
        console.error('Error processing mermaid diagram:', error);
        // Keep the original mermaid block if conversion fails
      }
    }

    return { content: processedContent, images };
  }
}
