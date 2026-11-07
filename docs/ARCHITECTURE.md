# PaperPilot AI — System Architecture & Data Flow

This document details the architectural design, ingestion pipeline, multi-strategy RAG execution graph, and citation coordinate rendering mechanics.

---

## 1. System Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + Vite 8 + Bun)"]
        UI["UI Layer (Tailwind CSS v4)"]
        Router["TanStack Router (Type-Safe Routes)"]
        Store["Zustand Global State (Workspace, Citations, PDF View)"]
        Query["TanStack Query (Cache & Async Sync)"]
        PDF["React-PDF Canvas (Dynamic Bounding Box Overlays)"]
    end

    subgraph API["FastAPI Backend (Python 3.12 + uv)"]
        direction TB
        V1["API Router (/api/v1)"]
        DocIngest["PyMuPDF Ingestion Service"]
        ArxivServ["arXiv Retrieval & Parser"]
        AnalysisServ["Paper Analysis & Synthesis Engine"]
        EvalServ["RAG Benchmark Lab"]
        RouterWork["LangGraph RAG Router"]
    end

    subgraph Data["Persistence & Vector Stores"]
        SQL["SQLite Database (Workspaces, Chunks, Messages, Citations)"]
        Vect["ChromaDB (768-dim BGE Embeddings)"]
        PDFStore["Local PDF Storage (/data/pdfs)"]
    end

    subgraph External["External Cloud Services"]
        Groq["Groq Cloud API (LPU Ultra-Fast LLM Inference)"]
        ArxivAPI["arXiv Export API (Search & Download)"]
    end

    UI --> Router
    Router --> Query
    Query --> Store
    Query -->|REST / SSE Streaming| V1

    V1 --> DocIngest
    V1 --> ArxivServ
    V1 --> AnalysisServ
    V1 --> EvalServ
    V1 --> RouterWork

    DocIngest -->|Layout Parsing & Text BBoxes| SQL
    DocIngest -->|Vector Embeddings| Vect
    DocIngest -->|Raw File Save| PDFStore

    ArxivServ -->|Fetch Papers| ArxivAPI
    ArxivServ --> DocIngest

    RouterWork -->|Top-k Similarity Search| Vect
    RouterWork -->|Chat Completion Prompts| Groq
    RouterWork -->|Save Messages & Citations| SQL

    EvalServ --> RouterWork
    EvalServ --> Groq

    Store -->|Citation Coordinate Triggers| PDF
```

---

## 2. Document Ingestion Pipeline

Academic papers are notorious for challenging multi-column layouts, header/footer noise, equations, and tables. PaperPilot AI handles this with a dedicated ingestion pipeline:

```mermaid
flowchart LR
    PDFFile["Raw PDF Upload / arXiv Download"] --> FitZ["PyMuPDF (fitz)"]
    FitZ --> Blocks["Text Page Extraction (sort=True)"]
    Blocks --> BBox["Bounding Box Extraction [ymin, xmin, ymax, xmax]"]
    BBox --> Norm["Normalize to % (0.0 - 100.0)"]
    Norm --> Clean["Filter Footers & Headers"]
    Clean --> Chunks["Chunk Segmenter (~600 chars, 100 overlap)"]
    Chunks --> Embed["BAAI/bge-base-en-v1.5 (SentenceTransformers)"]
    Embed --> DualWrite["Atomic Dual-Write"]
    DualWrite --> SQLite["SQLite (Text + BBoxes)"]
    DualWrite --> Chroma["ChromaDB (Vectors + Metadata)"]
```

### Bounding Box Percentage Coordinates
To render highlights seamlessly across any screen resolution and responsive zoom level, coordinates are extracted from PyMuPDF and normalized into percentages:

$$\text{ymin}\% = \frac{y_0}{\text{page\_height}} \times 100, \quad \text{xmin}\% = \frac{x_0}{\text{page\_width}} \times 100$$
$$\text{height}\% = \frac{y_1 - y_0}{\text{page\_height}} \times 100, \quad \text{width}\% = \frac{x_1 - x_0}{\text{page\_width}} \times 100$$

When the user clicks citation `[1]`, the frontend renders a high-contrast glowing overlay:
```tsx
<div
  className="absolute border-2 border-[#e06c38] bg-[#e06c38]/20 rounded transition-all animate-pulse pointer-events-none"
  style={{
    top: `${ymin}%`,
    left: `${xmin}%`,
    width: `${width}%`,
    height: `${height}%`,
  }}
/>
```

---

## 3. Streaming Chat & Citation Linking Sequence

The conversation view streams tokens live via Server-Sent Events (SSE), delivering an interactive typewriter experience while simultaneously resolving structured citations:

```mermaid
sequenceDiagram
    autonumber
    actor User as Researcher
    participant FE as Frontend (ChatContainer)
    participant BE as FastAPI (/api/v1/chat/stream)
    participant Router as RAG Router
    participant Chroma as ChromaDB
    participant Groq as Groq LLM API
    participant DB as SQLite DB

    User->>FE: Submits question: "What are the baselines?"
    FE->>BE: POST /api/v1/chat/stream (SSE Request)
    BE->>Router: Execute RAG Strategy (Basic, HyDE, or Fusion)
    
    alt Strategy is HyDE
        Router->>Groq: Generate hypothetical paper excerpt
        Groq-->>Router: Hypothetical answer
        Router->>Chroma: Vector search with hypothetical embedding
    else Strategy is RAG-Fusion
        Router->>Groq: Generate 3-4 orthogonal sub-queries
        Groq-->>Router: Sub-queries
        Router->>Chroma: Parallel vector searches
        Router->>Router: Reciprocal Rank Fusion (k=60)
    else Strategy is Basic RAG
        Router->>Chroma: Vector search with query embedding
    end

    Chroma-->>Router: Top-K context chunks with bounding boxes
    Router->>Groq: Synthesize grounded answer with inline [1] [2] markers
    
    loop Stream Tokens
        Groq-->>BE: Stream token delta
        BE-->>FE: SSE event: data: {"token": "..."}
        FE->>User: Live typewriter markdown display
    end

    BE->>DB: Save Conversation, Message, and Citations
    BE-->>FE: SSE event: data: {"citations": [{...bbox, page, text}]}
    BE-->>FE: SSE event: data: [DONE]
    FE->>User: Renders clickable citation badges [1], [2]
    
    User->>FE: Clicks [1]
    FE->>FE: Opens PDF viewer at target page & highlights exact paragraph
```

---

## 4. Frontend State & Component Hierarchy

- **Global Store (`useWorkspaceStore`)**:
  - `activeWorkspaceId`: Scopes all document queries, conversations, and benchmarks.
  - `selectedDocumentIds`: Multi-select paper filter for scoped RAG queries.
  - `activeRagStrategy`: `'basic' | 'hyde' | 'fusion'`.
  - `selectedModel`: LLM model identifier (e.g. `openai/gpt-oss-120b`).
  - `pdfViewerOpen`: Controls responsive side-by-side split screen.
  - `activeCitation`: Holds target page, bounding box coordinates, and quoted snippet.
- **Theme Store (`useThemeStore`)**:
  - Manages dark/light theme switching with instant DOM synchronization and persistent local storage.
- **TanStack Router**:
  - `/`: Overview Dashboard (stats, quick actions, workspace manager).
  - `/workspaces/$workspaceId`: 3-panel chat cockpit & synchronized PDF reader.
  - `/workspaces/$workspaceId/library`: Ingested paper manager & chunk inspector.
  - `/workspaces/$workspaceId/arxiv`: Live arXiv search & 1-click paper ingestion.
  - `/workspaces/$workspaceId/analysis`: Paper summarization, comparative matrix, and literature review.
  - `/workspaces/$workspaceId/evaluation`: RAG strategy benchmark lab.
