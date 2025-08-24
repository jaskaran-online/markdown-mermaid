export interface ExportOptions {
  title?: string;
  includeTOC?: boolean;
  theme?: "light" | "dark";
}

export interface ExportStrategy {
  export(content: string, options?: ExportOptions): Promise<void> | void;
}

