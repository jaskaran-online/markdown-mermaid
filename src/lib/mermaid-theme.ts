import mermaid from "mermaid";

export type MermaidTheme = "light" | "dark";

export function initMermaid(theme: MermaidTheme) {
  const mermaidTheme = theme === "dark" ? "dark" : "default";
  mermaid.initialize({
    startOnLoad: false,
    theme: mermaidTheme,
    securityLevel: "loose",
    fontFamily: "monospace",
    fontSize: 14,
    logLevel: 1,
    htmlLabels: true,
    flowchart: { useMaxWidth: true, htmlLabels: true },
    sequence: { useMaxWidth: true },
    er: { useMaxWidth: true },
  });
}

