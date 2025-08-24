export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  isMermaid: boolean;
}

export interface ProcessedMarkdown {
  html: string;
  codeBlocks: CodeBlock[];
}

