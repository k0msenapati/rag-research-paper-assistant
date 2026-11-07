# PaperPilot AI — Setup & Installation Guide

This guide provides step-by-step instructions to install and run **PaperPilot AI** on Linux, macOS, and Windows.

---

## 1. Prerequisites

Before installing PaperPilot AI, ensure you have the following installed:
- **Python 3.12+** ([python.org](https://www.python.org/downloads/))
- **uv** (ultra-fast modern Python package & environment manager)
- **Bun** (ultra-fast JavaScript runtime, bundler, and package manager)
- **Groq API Key** (free fast LLM inference key from [console.groq.com](https://console.groq.com/))

---

## 2. Installing uv & Bun

### How to Install `uv` (Python Package Manager)

`uv` is an extremely fast Python package and project manager developed by Astral (creators of Ruff). It replaces `pip`, `venv`, and `poetry`.

#### macOS / Linux
Run the official standalone installer:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
*Or using Homebrew (macOS/Linux):*
```bash
brew install uv
```

#### Windows
Run via PowerShell:
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```
*Or using WinGet:*
```powershell
winget install --id=astral-sh.uv -e
```

#### Alternative (using pip)
If you already have Python and pip installed:
```bash
pip install uv
```

#### Verify Installation
```bash
uv --version
# Expected: uv 0.4.x or higher
```

---

### How to Install `Bun` (JavaScript Runtime & Package Manager)

`Bun` is an all-in-one JavaScript runtime, bundler, and test runner that is up to 25x faster than npm.

#### macOS / Linux
Run the official install script:
```bash
curl -fsSL https://bun.sh/install | bash
```
*Or using Homebrew:*
```bash
brew install oven-sh/bun/bun
```

#### Windows
Install via PowerShell:
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```
*Or using Scoop:*
```powershell
scoop bucket add main
scoop install bun
```

#### Alternative (using npm)
```bash
npm install -g bun
```

#### Verify Installation
```bash
bun --version
# Expected: 1.1.x or higher
```

---

## 3. Clone the Repository & Configure Environment

```bash
git clone https://github.com/your-username/rag-research-paper-assistant.git
cd rag-research-paper-assistant
```

### Configure `.env`
Create a `.env` file in the project root or inside `backend/.env`:
```bash
cp .env.example .env 2>/dev/null || touch backend/.env
```

Add your Groq API key:
```env
# backend/.env
GROQ_API_KEY=gsk_your_groq_api_key_here
DEFAULT_LLM_MODEL=openai/gpt-oss-120b
EMBEDDING_MODEL_NAME=BAAI/bge-base-en-v1.5
```

> [!TIP]
> Groq offers a generous free tier with high rate limits. Get your API key at [console.groq.com](https://console.groq.com/keys).

---

## 4. Backend Setup

The backend is built with FastAPI, SQLite, ChromaDB, and PyMuPDF.

### 1. Install Python Dependencies
```bash
cd backend
uv sync
```
This automatically creates a high-performance virtual environment (`.venv`) and installs all required dependencies (FastAPI, PyMuPDF, ChromaDB, Sentence-Transformers, LangChain, etc.).

### 2. Run Backend Tests
Run the complete automated test suite (unit + integration tests):
```bash
uv run pytest
```
*All 15 tests should pass cleanly in ~30s.*

### 3. Launch Backend API Server
```bash
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API will be accessible at: `http://127.0.0.1:8000`
- Interactive Swagger docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

---

## 5. Frontend Setup

The frontend is built with React 19, Vite 8, TypeScript 7, Tailwind CSS v4, and `@tanstack/react-router`.

### 1. Install Frontend Dependencies
```bash
cd ../frontend
bun install
```

### 2. Verify Production Build & Type Checking
```bash
bun run build
```
*Builds in under 1 second!*

### 3. Launch Frontend Development Server
```bash
bun run dev
```
- Web application will be live at: `http://127.0.0.1:5173`
- The Vite server automatically proxies `/api` requests to `http://127.0.0.1:8000`.

---

## 6. Verification Checklist

1. Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.
2. Create a research workspace (e.g., "Transformer Architectures").
3. Go to **arXiv Discovery** and search for `2005.11401` or "Retrieval-Augmented Generation".
4. Click **Import & Ingest** — observe PyMuPDF extract layout text and compute bounding box percentages.
5. In the **Workspace Chat**, ask `"What datasets did the authors evaluate RAG on?"`.
6. Click any citation chip `[1]` — observe the split-screen PDF reader slide open directly to the highlighted paragraph!
7. Navigate to the **RAG Benchmarks** tab and click **Run Benchmark** to evaluate Basic RAG vs HyDE vs RAG-Fusion.

---

## 7. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `GROQ_API_KEY is not set` | Missing `.env` | Ensure `.env` is created in `backend/.env` with a valid key. |
| `Port 8000 already in use` | Lingering uvicorn process | Run `fuser -k 8000/tcp` (Linux) or terminate Python task. |
| `Port 5173 already in use` | Lingering vite process | Run `fuser -k 5173/tcp` or start Vite on another port. |
| `PDF worker failed to load` | Blocked CDN script | `react-pdf` is configured to load unpkg matching its version; ensure outbound internet access is active. |
| `PyMuPDF / fitz build error` | Missing C compiler on old OS | Install `build-essential` (Ubuntu/Debian) or `xcode-select --install` (macOS). |
