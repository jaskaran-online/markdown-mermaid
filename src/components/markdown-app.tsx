"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownPreview } from "./markdown-preview";
import { DocumentTabs } from "./document-tabs";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ExportUtils } from "@/lib/export-utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

// Sample content - fallback if markdown import fails
const SAMPLE_CONTENT = `# SEO-Friendly Blog System - Mermaid Diagrams Collection

## 1. Admin User Flow

\`\`\`mermaid
flowchart TD
    A[Admin Access] --> B{Authenticated?}
    B -->|No| C[Login Page<br/>/admin/login]
    B -->|Yes| D[Dashboard<br/>/admin/dashboard]
    C --> E[BetterAuth Login]
    E --> F{Login Success?}
    F -->|No| C
    F -->|Yes| D

    D --> G[View Posts List]
    D --> H[Quick Stats]
    D --> I[Create New Post]
    D --> J[Manage Categories]
    D --> K[Manage Tags]
    D --> L[Media Management]

    I --> M[Post Creation Form]
    M --> N[Upload Cover Image<br/>to S3]
    M --> O[Add Content<br/>Markdown/WYSIWYG]
    M --> P[Set SEO Metadata]
    M --> Q[Assign Categories/Tags]
    M --> R{Save Action}
    R -->|Draft| S[Save as Draft]
    R -->|Publish| T[Publish Post]

    G --> U[Edit Existing Post<br/>/admin/posts/id/edit]
    U --> M

    style A fill:#e1f5fe
    style D fill:#c8e6c9
    style T fill:#81c784
\`\`\`

## 2. Frontend Visitor Flow

\`\`\`mermaid
flowchart TD
    A[Visitor Arrives] --> B[Homepage<br/>/]
    B --> C[Browse Featured Posts]
    B --> D[Navigate to Blog<br/>/blog]

    D --> E[View All Posts<br/>Paginated]
    E --> F[Filter by Category<br/>/category/slug]
    E --> G[Search Posts]
    E --> H[Select Post<br/>/blog/slug]

    H --> I[Read Full Post]
    I --> J[View Related Posts]
    I --> K[Share via Social]

    C --> H
    F --> H

    B --> L[Static Pages]
    L --> M[About Page<br/>/about]
    L --> N[Contact Page<br/>/contact]

    O[SEO Crawlers] --> P[Sitemap.xml<br/>/sitemap.xml]
    O --> Q[RSS Feed<br/>/rss.xml]
    O --> R[robots.txt]

    style A fill:#fff3e0
    style B fill:#ffcc02
    style I fill:#4caf50
    style O fill:#9c27b0
\`\`\`

## 3. Database Entity Relationship Diagram (ERD)

\`\`\`mermaid
erDiagram
    users {
        int id PK "AUTO_INCREMENT"
        varchar name "User full name"
        varchar email UK "Unique email"
        enum role "admin, editor"
        datetime created_at "Account creation"
    }

    posts {
        int id PK "AUTO_INCREMENT"
        varchar title "Post title"
        varchar slug UK "URL-friendly slug"
        text cover_image "S3 URL for cover"
        longtext content "Post content"
        varchar meta_title "SEO title"
        text meta_description "SEO description"
        varchar canonical_url "Canonical URL"
        enum status "draft, published, archived"
        int author_id FK "Reference to users"
        datetime published_at "Publication date"
        datetime created_at "Creation timestamp"
        datetime updated_at "Last modification"
    }

    categories {
        int id PK "AUTO_INCREMENT"
        varchar name "Category name"
        varchar slug UK "URL-friendly slug"
    }

    tags {
        int id PK "AUTO_INCREMENT"
        varchar name "Tag name"
        varchar slug UK "URL-friendly slug"
    }

    post_categories {
        int post_id FK "Post reference"
        int category_id FK "Category reference"
    }

    post_tags {
        int post_id FK "Post reference"
        int tag_id FK "Tag reference"
    }

    users ||--o{ posts : "authors"
    posts ||--o{ post_categories : "categorizes"
    categories ||--o{ post_categories : "contains"
    posts ||--o{ post_tags : "tags"
    tags ||--o{ post_tags : "applied_to"
\`\`\`

## 4. System Architecture Flow

\`\`\`mermaid
flowchart TB
    subgraph "Frontend Layer"
        A[Next.js App]
        B[Public Pages]
        C[Admin Dashboard]
        D[Tailwind CSS]
    end

    subgraph "Authentication"
        E[BetterAuth]
        F[Session Management]
    end

    subgraph "API Layer"
        G[Next.js API Routes]
        H[Post CRUD APIs]
        I[Upload API]
        J[RSS API]
    end

    subgraph "Database Layer"
        K[MySQL Database]
        L[Drizzle ORM]
    end

    subgraph "External Services"
        M[AWS S3]
        N[CDN Distribution]
    end

    subgraph "SEO & Syndication"
        O[Sitemap Generator]
        P[RSS Feed]
        Q[Meta Tags]
        R[Schema Markup]
    end

    A --> B
    A --> C
    C --> E
    E --> F
    B --> G
    C --> G
    G --> H
    G --> I
    G --> J
    H --> L
    I --> M
    L --> K
    M --> N
    B --> O
    B --> P
    B --> Q
    B --> R

    style A fill:#2196f3,color:#fff
    style K fill:#ff9800,color:#fff
    style M fill:#4caf50,color:#fff
\`\`\`

## 5. API Architecture Diagram

\`\`\`mermaid
flowchart LR
    subgraph "Public APIs"
        A[GET /api/posts]
        B[GET /api/posts/slug]
        C[GET /api/rss]
        D[GET /sitemap.xml]
    end

    subgraph "Admin APIs"
        E[POST /api/posts]
        F[PATCH /api/posts/id]
        G[DELETE /api/posts/id]
        H[POST /api/upload]
    end

    subgraph "Auth Protection"
        I[BetterAuth Middleware]
    end

    subgraph "Data Sources"
        J[MySQL via Drizzle]
        K[AWS S3]
    end

    A --> J
    B --> J
    C --> J
    D --> J
    E --> I
    F --> I
    G --> I
    H --> I
    I --> J
    H --> K

    style A fill:#e8f5e8
    style E fill:#fff3e0
    style I fill:#ffebee
\`\`\`

## 6. AWS S3 Upload Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant Admin as Admin User
    participant UI as Admin Interface
    participant API as Upload API
    participant S3 as AWS S3
    participant DB as MySQL Database

    Admin->>UI: Select file for upload
    UI->>API: POST /api/upload with file
    API->>S3: Generate signed URL
    S3->>API: Return signed URL
    API->>S3: Upload file using signed URL
    S3->>API: Confirm upload success
    API->>DB: Store S3 URL in database
    DB->>API: Confirm storage
    API->>UI: Return S3 URL
    UI->>Admin: Display uploaded image

    Note over Admin,DB: Complete file upload workflow
    Note over API,S3: Secure upload via signed URLs
\`\`\`

## 7. Authentication Flow Diagram

\`\`\`mermaid
flowchart TD
    A[User Access Request] --> B{Route Protected?}
    B -->|No| C[Allow Access]
    B -->|Yes| D{User Authenticated?}

    D -->|No| E[Redirect to Login]
    D -->|Yes| F{Check User Role}

    E --> G[BetterAuth Login Form]
    G --> H[Submit Credentials]
    H --> I{Valid Credentials?}

    I -->|No| J[Show Error Message]
    I -->|Yes| K[Create Session]

    J --> G
    K --> L[Set Auth Cookie]
    L --> F

    F --> M{Admin Route?}
    M -->|Yes| N{Is Admin/Editor?}
    M -->|No| O[Allow Access]

    N -->|No| P[Access Denied]
    N -->|Yes| Q[Allow Admin Access]

    style A fill:#e3f2fd
    style K fill:#c8e6c9
    style P fill:#ffcdd2
    style Q fill:#81c784
\`\`\`

## 8. Content Publishing Workflow

\`\`\`mermaid
flowchart TD
    A[Start Creating Post] --> B[Fill Basic Info]
    B --> C[Add Title & Slug]
    C --> D[Upload Cover Image]
    D --> E[Write Content]
    E --> F[Add Categories/Tags]
    F --> G[Set SEO Metadata]
    G --> H{Review Content}

    H -->|Needs Changes| I[Edit Content]
    I --> H

    H -->|Ready| J{Publishing Choice}
    J -->|Save Draft| K[Save as Draft]
    J -->|Schedule| L[Set Publish Date]
    J -->|Publish Now| M[Publish Immediately]

    K --> N[Draft Saved]
    L --> O[Scheduled for Publishing]
    M --> P[Post Published]

    P --> Q[Update Sitemap]
    P --> R[Update RSS Feed]
    P --> S[Clear Cache]

    style A fill:#e1f5fe
    style P fill:#4caf50,color:#fff
    style N fill:#fff9c4
    style O fill:#f3e5f5
\`\`\`

## 9. SEO Optimization Flow

\`\`\`mermaid
flowchart TD
    A[Post Creation] --> B[Generate SEO Elements]

    B --> C[Auto-generate Slug]
    B --> D[Create Meta Title]
    B --> E[Generate Meta Description]
    B --> F[Add Open Graph Tags]
    B --> G[Create Schema Markup]

    C --> H[URL Structure Check]
    D --> I[Title Length Validation]
    E --> J[Description Length Check]
    F --> K[Social Media Preview]
    G --> L[Structured Data Validation]

    H --> M{SEO Score Check}
    I --> M
    J --> M
    K --> M
    L --> M

    M -->|Low Score| N[Show SEO Suggestions]
    M -->|Good Score| O[SEO Optimized]

    N --> P[Implement Suggestions]
    P --> M

    O --> Q[Update Sitemap]
    O --> R[Submit to Search Engines]

    style A fill:#e8f5e8
    style O fill:#4caf50,color:#fff
    style N fill:#ff9800,color:#fff
\`\`\`

## 10. Database Query Optimization Flow

\`\`\`mermaid
flowchart TD
    A[Database Query Request] --> B{Query Type}

    B -->|SELECT Posts| C[Check Index Usage]
    B -->|INSERT Post| D[Validate Data]
    B -->|UPDATE Post| E[Check Permissions]
    B -->|DELETE Post| F[Cascade Check]

    C --> G{Use Index?}
    G -->|Yes| H[Fast Query Execution]
    G -->|No| I[Add Missing Index]

    D --> J[Drizzle ORM Validation]
    E --> K[Update Timestamps]
    F --> L[Remove Related Data]

    H --> M[Return Results]
    I --> N[Optimize Query]
    J --> O[Insert Record]
    K --> P[Update Record]
    L --> Q[Delete Record]

    N --> H
    O --> M
    P --> M
    Q --> M

    M --> R[Cache Results]
    R --> S[Return to Client]

    style A fill:#e3f2fd
    style H fill:#4caf50,color:#fff
    style I fill:#ff9800,color:#fff
\`\`\`

## 11. Content Discovery & Search Flow

\`\`\`mermaid
flowchart TD
    A[User Search/Browse] --> B{Search Type}

    B -->|Text Search| C[Search in Title/Content]
    B -->|Category Filter| D[Filter by Category]
    B -->|Tag Filter| E[Filter by Tags]
    B -->|Date Range| F[Filter by Date]

    C --> G[Full-text Search Query]
    D --> H[Category Join Query]
    E --> I[Tag Join Query]
    F --> J[Date Range Query]

    G --> K[Apply Filters]
    H --> K
    I --> K
    J --> K

    K --> L[Sort Results]
    L --> M{Results Found?}

    M -->|No| N[Show No Results]
    M -->|Yes| O[Paginate Results]

    O --> P[Display Results]
    P --> Q[Load More Option]

    N --> R[Suggest Alternative]
    Q --> S[Infinite Scroll/Pagination]

    style A fill:#fff3e0
    style P fill:#4caf50,color:#fff
    style N fill:#ffcdd2
\`\`\`

## 12. Performance Monitoring Flow

\`\`\`mermaid
flowchart TD
    A[Application Request] --> B[Performance Tracking Start]

    B --> C[Database Query Time]
    B --> D[API Response Time]
    B --> E[File Upload Time]
    B --> F[Page Load Time]

    C --> G{Query > 100ms?}
    D --> H{Response > 200ms?}
    E --> I{Upload > 5s?}
    F --> J{Load > 3s?}

    G -->|Yes| K[Log Slow Query]
    G -->|No| L[Normal Performance]

    H -->|Yes| M[Log Slow API]
    H -->|No| L

    I -->|Yes| N[Optimize File Size]
    I -->|No| L

    J -->|Yes| O[Optimize Resources]
    J -->|No| L

    K --> P[Performance Alert]
    M --> P
    N --> P
    O --> P

    L --> Q[Continue Normal Operation]
    P --> R[Performance Review]

    style A fill:#e1f5fe
    style L fill:#4caf50,color:#fff
    style P fill:#ff9800,color:#fff
\`\`\`

Each diagram is now standalone and can be copied individually. You can use these in documentation, presentations, or development planning. Each diagram focuses on a specific aspect of your SEO-friendly blog system and includes appropriate styling and annotations for clarity.`;

const DEFAULT_CONTENT = `# Welcome to Markdown + Mermaid Editor

This is a **live preview** editor with *Mermaid diagram* support.

## Features

- Two-pane layout (editor + preview)
- Live preview updates
- Markdown syntax highlighting
- Export capabilities

## Example Mermaid Diagrams

### Flowchart
\`\`\`mermaid
graph TD
    A[Start] --> B[Edit Markdown]
    B --> C[See Preview]
    C --> D[Export Document]
\`\`\`

### Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Preview

    User->>Editor: Type Markdown
    Editor->>Preview: Update Live Preview
    Preview->>User: Show Rendered Content
\`\`\`

### Class Diagram
\`\`\`mermaid
classDiagram
    class MarkdownEditor {
        +content: string
        +onChange()
        +render()
    }
    class MarkdownPreview {
        +content: string
        +render()
    }
    MarkdownEditor --> MarkdownPreview : updates
\`\`\`

## More Content

You can type here and see the preview update in real-time!

- Item 1
- Item 2
- Item 3

> This is a blockquote
>
> With multiple lines

\`\`\`javascript
console.log('Hello, World!');
\`\`\`
`;

export function MarkdownApp() {
  const {
    documents,
    currentDocument,
    currentDocumentId,
    isLoading,
    createDocument,
    updateDocument,
    switchDocument,
    closeDocument,
  } = useLocalStorage();

  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [urlInput, setUrlInput] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  // Load current document on mount
  useEffect(() => {
    if (!isLoading && currentDocument) {
      setContent(currentDocument.content);
    } else if (!isLoading && !currentDocument) {
      // Create a new document if none exists
      const newDoc = createDocument("Untitled", DEFAULT_CONTENT);
      setContent(newDoc.content);
    }
  }, [isLoading, currentDocument, createDocument]);

  // Autosave with debouncing
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);

      // Use a more stable approach without causing editor focus issues
      if (currentDocument) {
        // Update document immediately without debouncing to prevent cursor jumping
        updateDocument(currentDocument.id, { content: newContent });
      }
    },
    [currentDocument, updateDocument]
  );

  const handleNewDocument = () => {
    const newDoc = createDocument("Untitled", DEFAULT_CONTENT);
    setContent(newDoc.content);
  };

  const handleLoadSample = () => {
    setContent(SAMPLE_CONTENT);
    if (currentDocument) {
      updateDocument(currentDocument.id, { content: SAMPLE_CONTENT });
    }
  };

  const handleLoadFromUrl = async () => {
    if (!urlInput) return;

    try {
      let url = urlInput;
      // Check if it's a GitHub Gist URL
      if (url.includes("gist.github.com")) {
        // Convert to raw URL
        url =
          url.replace("gist.github.com", "gist.githubusercontent.com") + "/raw";
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${response.statusText}`);
      }
      const text = await response.text();
      setContent(text);
      if (currentDocument) {
        updateDocument(currentDocument.id, { content: text });
      }
    } catch (error) {
      console.error("Error loading from URL:", error);
      alert("Failed to load from URL. Please check the URL and try again.");
    }
  };

  const handleSave = () => {
    if (currentDocument) {
      updateDocument(currentDocument.id, { content });
    }
  };

  const handleExport = async (format: "md" | "html" | "pdf" | "docx") => {
    const title = currentDocument?.title || "Document";

    try {
      switch (format) {
        case "md":
          ExportUtils.exportToMarkdown(content, `${title}.md`);
          break;
        case "html":
          await ExportUtils.exportToHTML(content, { title });
          break;
        case "pdf":
          await ExportUtils.exportToPDF(
            content,
            title,
            previewRef.current || undefined
          );
          break;
        case "docx":
          await ExportUtils.exportToDOCX(content, title);
          break;
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      alert(`Error exporting to ${format.toUpperCase()}. Please try again.`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Markdown + Mermaid Editor</h1>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter Gist URL or file path"
            className="border px-2 py-1 rounded-md text-sm"
          />
          <Button variant="outline" size="sm" onClick={handleLoadFromUrl}>
            Load from URL
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleNewDocument}>
            New
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoadSample}>
            Load Sample
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("md")}
          >
            Export MD
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("html")}
          >
            Export HTML
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
          >
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("docx")}
          >
            Export DOCX
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Document tabs */}
      <DocumentTabs
        documents={documents}
        currentDocumentId={currentDocumentId}
        onSwitchDocument={switchDocument}
        onCloseDocument={closeDocument}
        onNewDocument={handleNewDocument}
      />

      {/* Main content */}
      <div className="flex-1 flex">
        <div className="flex-1 border-r">
          <MarkdownEditor
            value={content}
            onChange={handleContentChange}
            className="h-full"
          />
        </div>
        <div className="flex-1">
          <MarkdownPreview
            content={content}
            className="h-full"
            previewRef={previewRef}
          />
        </div>
      </div>
    </div>
  );
}
