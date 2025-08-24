# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router pages, layout, global styles (`globals.css`).
- `src/components/`: Reusable React components (e.g., `markdown-editor.tsx`, `markdown-preview.tsx`).
- `src/lib/`: Utilities for Markdown/Mermaid and export (e.g., `mermaid-utils.ts`, `export-utils.ts`).
- `src/hooks/` and `src/contexts/`: Shared hooks/context (e.g., `use-local-storage.ts`, `theme-context.tsx`).
- `public/`: Static assets served as-is.
- Config: `next.config.ts` (adds `raw-loader` for `.md`), `tailwind.config.js`, `eslint.config.mjs`.

## Build, Test, and Development Commands
- `npm run dev`: Start dev server with Turbopack at `http://localhost:3000`.
- `npm run build`: Produce production build (Turbopack).
- `npm start`: Run the built app.
- `npm run lint`: Lint the codebase using Next/TypeScript ESLint config.

## Coding Style & Naming Conventions
- **Language/stack**: TypeScript + React (Next.js App Router) with Tailwind CSS.
- **ESLint**: Extends `next/core-web-vitals` and `next/typescript`. Fix issues before committing.
- **Files**: kebab-case for filenames (`markdown-editor.tsx`); export components as PascalCase.
- **Styling**: Prefer Tailwind utility classes; theme via CSS variables defined in Tailwind config.
- **Imports**: Group by lib/components/hooks; keep relative paths tidy.

## Testing Guidelines
- No automated tests yet. When adding tests:
  - Prefer component tests with React Testing Library + Vitest, and e2e with Playwright.
  - Co-locate tests: `src/components/markdown-editor.test.tsx`.
  - Add `npm run test` and ensure CI runs `lint`, `build`, and `test`.

## Commit & Pull Request Guidelines
- **Commits**: Use Conventional Commits (e.g., `feat: add Mermaid download buttons`, `fix: prevent diagram disappearance`, `refactor: cleanup preview`).
- **PRs must include**:
  - Clear description and rationale; reference issues (e.g., `Closes #123`).
  - Screenshots/GIFs for UI changes (editor/preview, modals, exports).
  - Checklist: `npm run lint` and `npm run build` pass locally.
  - Scope: touch only relevant files; place new code under the correct folder (`components/`, `lib/`, etc.).

## Security & Configuration Tips
- App is client-only; avoid adding server code or network calls.
- Sanitize Markdown/HTML and keep Mermaid usage safe (no remote script execution).
- Keep dependencies minimal and pinned; verify changes to `next.config.ts` and `tailwind.config.js` don’t affect exports.

