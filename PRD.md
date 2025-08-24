# Product Requirements Document (PRD)

## Markdown + Mermaid Editor/Preview (Web‑Only)

Last updated: 2025-08-24

Owner: Jaskaran Singh

## 1) Overview

Build a fast, reliable, two‑pane Markdown editor with live preview that fully supports Mermaid diagrams. Runs entirely in the browser (client‑side, no backend). Users can author Markdown in a code‑editor pane and see a pixel‑perfect preview beside it. Content can be exported to multiple formats (Markdown, HTML, PDF, DOCX), preserving styles and rendering Mermaid diagrams into vector graphics where applicable. Work‑in‑progress state persists locally via browser storage (localStorage); no accounts or cloud storage.

## 2) Goals and Non‑Goals

### Goals

- Two‑pane layout: editor (left) + live preview (right).
- GitHub‑flavored Markdown (GFM) rendering with Mermaid diagram support.
- High‑quality export: MD (source), HTML (self‑contained), PDF, DOCX.
- Smooth typing with low‑latency preview and scroll sync.
- Sensible defaults for typography and theming (light/dark).
- Safe rendering: sanitize HTML; never run untrusted scripts.
- Web‑only, client‑side; no backend or sign‑in.
- Persistence via localStorage; works offline.

### Non‑Goals (initial release)

- Real‑time multi‑user collaboration.
- Cloud sync or shared documents.
- Advanced WYSIWYG editing; this is source‑oriented.
- Equation rendering (MathJax/KaTeX) beyond basic text unless explicitly prioritized.
- Mermaid “external resource” loading or custom JS execution.
- Native desktop packaging (Electron) or OS‑level filesystem APIs.

## 3) Personas

- Technical Writer: drafts specs with diagrams; needs export to PDF/DOCX for stakeholders.
- Engineer: documents architecture using Markdown and Mermaid; prefers keyboard flow.
- Student/Researcher: takes notes, exports as PDF; values offline use and simplicity.

## 4) Top Use Cases and User Stories

1. As a writer, I type Markdown and immediately see a faithful preview with diagrams.
2. As a user, I paste a Mermaid diagram into a fenced code block and see it render.
3. As an author, I export my document to PDF with correct fonts, layout, and diagrams.
4. As a stakeholder, I need a DOCX export with headings, lists, images, and diagrams embedded.
5. As a developer, I open an existing `.md` file, edit, autosave, and keep version history locally.
6. As a user, I switch to dark mode and both editor and preview adapt consistently.
7. As a user, I find text and replace across the document with standard shortcuts.
8. As a user, I drag‑and‑drop a `.md` file into the app to open it.

## 5) Scope and Requirements

### 5.1 Functional Requirements

Editor

- Monospace code editor with Markdown syntax highlighting and GFM extensions.
- Line numbers, soft wrap toggle, indent (Tab/Shift+Tab), auto‑pair brackets/quotes.
- Keyboard shortcuts: new/open/save/save‑as, undo/redo, find/replace, toggle preview, export.
- Command palette or menu access to common actions.
- Snippets for fenced code blocks (```+ language), including`mermaid`.
- Optional spellcheck toggle.

Preview

- Live preview updates as user types (debounced, ≤150 ms after idle, max 300 ms under load).
- Supports GFM: tables, task lists, strikethrough, autolink, fenced code, footnotes.
- Mermaid: render fenced blocks with language `mermaid`; show error state for invalid diagrams.
- Scroll sync: editor and preview track the nearest heading or paragraph.
- Theme aware: light/dark with synchronized Mermaid theme; user can override Mermaid theme.
- Sanitization: strip or neutralize unsafe HTML; allow a safe subset of inline HTML optionally.

Files and Persistence (Web‑only)

- Open `.md` files via file picker or drag‑and‑drop (processed in memory; never uploaded).
- Save/Export via browser download (File System Access API if available; otherwise blob download).
- Autosave: snapshot current document to `localStorage` on change (debounced ~2s).
- “Dirty” indicator for unsaved changes; prompt on tab/window close if unsaved.
- Recent files list in `localStorage` (names and timestamps; no full paths stored).
- Optional in‑browser “Untitled” documents managed in `localStorage` until downloaded.

Export

- MD: save current source as `.md`.
- HTML: export a self‑contained HTML (inline CSS and optional base64 images) that renders Mermaid offline.
- PDF: export via browser print‑to‑PDF from a print‑optimized HTML view; margins, page size, header/footer via print CSS.
- DOCX: export with correct heading hierarchy, lists, images, code blocks; Mermaid diagrams embedded as vector (SVG) or high‑DPI PNG fallback.
- Export options dialog: choose filename, location, page options (PDF), theme (light/dark), and inclusion of Table of Contents (optional for HTML/PDF).

Mermaid

- Support recent Mermaid syntax (v10+), sequence/flowchart/class/state/ER/gantt/pie/etc.
- Render errors surface inline in preview with helpful message and copyable diagnostics.
- Security: disallow directives loading remote resources; sandbox rendering.

Theming and Appearance

- Light and dark themes; system auto option.
- Consistent typography between preview and export (font family, sizes, code font).
- Optional “reader” width for preview; toggle full‑width.

Accessibility (A11y)

- Keyboard navigable UI, visible focus states.
- Screen reader labels for editor, preview, and controls.
- Sufficient color contrast (WCAG 2.1 AA).
- Scalable UI: respects OS text scaling and zoom.

Internationalization (i18n)

- English default; strings externalized for future localization.

Settings

- Preferences: theme, preview update debounce, autosave, default export options, spellcheck, Mermaid theme.
- Reset to defaults.

Error Handling

- Non‑blocking toast for recoverable errors; modal for destructive actions (e.g., overwrite).
- Clear messages on export failures with retry and path suggestions.

### 5.2 Non‑Functional Requirements

Performance

- Typing latency: editor input ≤10 ms median, ≤30 ms p95 on typical hardware.
- Preview update: first paint ≤150 ms after idle, ≤500 ms p95 for large docs (~10k lines).
- Export PDF of 100‑page document in ≤20 seconds on typical hardware.

Reliability

- Crash‑free sessions ≥99.9% weekly.
- Autosave prevents data loss on crash for changes older than 3 seconds.

Security and Privacy

- No network calls; all processing is local to the browser.
- Sanitize Markdown/HTML to prevent XSS in preview and exported HTML.
- File access limited to files user selects; no background scanning.
- No telemetry or analytics in MVP.

Compatibility

- Desktop web only: latest Chrome, Edge, Firefox, Safari.

## 6) UX and Interaction Design

Layout

- Two resizable panes: editor (left), preview (right), with draggable splitter; pane widths persist across sessions.
- Top app bar: File, Edit, View, Export, Help menus or a compact toolbar with icons and labels.
- Status bar: file path, line/column, word count, theme toggle.

Flows

- New document: File > New → Untitled.md opens → typing autosaves to temp until Save.
- Open document: File > Open or drag‑and‑drop → Editor loads content → Preview renders immediately.
- Export: Export button/menu → dialog → select format/options → progress → success/failure.
- Theme: toggle in status bar → editor/preview and Mermaid re‑theme instantly.

Editor Details

- Markdown shortcuts: `Ctrl/Cmd+B/I/K` for bold/italic/link; backticks for code.
- Find/Replace: `Ctrl/Cmd+F` and `Ctrl/Cmd+H`, with regex and case options.
- Linting: optional Markdown lint rules (headings increment, trailing spaces) with inline hints.

Preview Details

- Scroll sync: heading map; when cursor near H2 in editor, preview anchors to same section.
- Clickable ToC (optional view): floating panel generated from headings; clicking scrolls editor and preview.
- Copy as HTML: select content from preview and copy without control characters.

Mermaid Details

- Diagram theme auto‑aligns with app theme; user can override per‑document in settings.
- Render errors show a banner inside the diagram container with an expand/collapse for details.

## 7) Data Model and Storage

Local Files

- Primary format: `.md` text, UTF‑8, LF line endings by default.
- Opened files are handled in memory only; nothing is uploaded or stored remotely.

Preferences

- Stored in `localStorage` keyed by version; includes theme, debounce, autosave, recent files, and last document snapshot(s).

Export Artifacts

- HTML: single file, includes inline CSS and embedded Mermaid script or pre‑rendered SVGs.
- PDF: produced via browser print pipeline from a print‑optimized HTML view; metadata includes title, author (optional), subject.
- DOCX: OOXML package with styles for headings, code, and embedded images/SVG.

## 8) Import/Export Mapping

Markdown → HTML

- Headings → `<h1..h6>`; anchors for headings with slug IDs.
- Lists, tables, task lists, blockquotes map to standard HTML with GFM classes.
- Code blocks → `<pre><code class="language-...">` with syntax highlighting (client‑side or pre‑rendered).
- Mermaid blocks → rendered SVG within `<figure>` with `<figcaption>` if title provided.

Markdown → PDF

- Use the same HTML rendering path, printed to PDF; ensure page breaks before `h1`/`h2` optional.
- Embed fonts; ensure selectable text and vector diagrams.

Markdown → DOCX

- Headings mapped to built‑in `Heading 1..6` styles.
- Inline code mapped to `Code` style; code blocks to monospaced `Code Block` style.
- Mermaid diagrams embedded as SVG (preferred) or PNG fallback with 2x density.
- Links preserved and clickable.

Markdown → MD

- Save source as‑is with normalized EOL if user opts in.

## 9) Accessibility and Localization

- Ensure ARIA roles for editor (textbox) and preview (document/region) with labels.
- Respect OS reduced motion; minimize animated transitions.
- Localize all visible strings; initial release ships English only.

## 10) Telemetry and Logging

- Out of scope for web‑only MVP; no analytics or network calls.

## 11) Quality, Testing, and Acceptance Criteria

Acceptance Criteria (MVP)

- Editor and preview are visible side‑by‑side; resizing persists.
- Typing renders preview updates within 150 ms typical; 500 ms p95 on long docs.
- Mermaid fenced blocks render across supported diagram types; invalid blocks show readable errors.
- Export produces: `.md` identical to editor text; `.html` self‑contained; `.pdf` with correct pagination and clickable links; `.docx` with correct headings and embedded diagrams.
- Dark mode applies to both editor and preview; Mermaid respects dark theme.
- Files open via menu and drag‑drop; autosave works; unsaved changes prompt on close.
- No network access required to view, edit, render, or export.

Manual Test Scenarios

- Large document (10k lines) renders with acceptable latency; memory usage remains stable.
- Complex Mermaid (gantt, class) renders; theme toggle doesn’t break visuals.
- Export each format and verify against a visual baseline.
- Attempt XSS via script tags or onerror handlers; preview/export stay safe.

## 12) Milestones and Phases

MVP (v1.0)

- Editor + Preview with GFM and Mermaid.
- Export MD/HTML/PDF/DOCX.
- Autosave, recent files, drag‑drop.
- Light/Dark themes; basic settings.

v1.1

- ToC panel; copy as HTML; spellcheck toggle.
- Configurable PDF header/footer and page break controls.

v1.2

- Markdown linting rules; configurable preview CSS themes.
- Performance and memory optimizations for very large documents.

## 13) Risks and Mitigations

- DOCX fidelity risk: complex layouts may not map perfectly. Mitigation: define supported subset; provide PNG fallback for diagrams.
- Mermaid rendering differences across versions. Mitigation: pin version; expose per‑doc theme option.
- Performance on huge files. Mitigation: debounced rendering, virtualized preview, incremental parsing.
- Security concerns from raw HTML. Mitigation: robust sanitizer; optional strict mode (disallow raw HTML entirely).

## 14) Metrics and Success Criteria

- Export success rate ≥99% per week.
- Crash‑free sessions ≥99.9%.
- Median time‑to‑preview update ≤150 ms.
- NPS ≥40 within first 60 days post‑launch (if surveying opted‑in users).
- Weekly active users growth and retention (if telemetry enabled).

## 15) Open Questions

- Collaboration: Any need for commenting or multi‑user editing later?
- Math support: Should we include KaTeX/MathJax in MVP?
- Custom CSS: Allow user‑supplied CSS for preview/export?
- Diagram export: Always render Mermaid to SVG in HTML/DOCX/PDF, or keep live Mermaid in HTML? Default remains pre‑rendered SVG for portability.

## 16) Out of Scope (for now)

- Mobile apps and narrow viewports below 768px width.
- Real‑time collaboration, comments, or presence.
- Cloud storage integrations (Drive, Dropbox, Git);
- Plugin marketplace or arbitrary JS execution.
- Native desktop packaging (Electron) and OS‑level integrations.

## 17) References

- GitHub‑flavored Markdown spec
- Mermaid v10+ documentation
- DOCX OOXML reference (for mapping styles)
