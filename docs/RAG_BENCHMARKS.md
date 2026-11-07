# Multi-Strategy RAG & Empirical Benchmark Lab

In academic research, information retrieval cannot afford to be sloppy. Hallucinated equations, misattributed citations, or overlooked nuances in double-column PDF tables can invalidate entire scientific hypotheses.

**PaperPilot AI** implements three specialized Retrieval-Augmented Generation (RAG) architectures and provides an empirical evaluation laboratory to benchmark their performance side-by-side.

---

## 1. The Three RAG Strategies

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Research Query                             │
└───────────────────┬───────────────────┬───────────────────┬────────────┘
                    │                   │                   │
            [ Strategy A ]      [ Strategy B ]      [ Strategy C ]
               Basic RAG             HyDE             RAG-Fusion
                    │                   │                   │
         Dense Embedding of       Zero-Shot LLM       LLM Generates
            Direct Query       Hypothetical Answer   3-4 Sub-Queries
                    │                   │                   │
              Single Vector       Embeds Answer        Parallel Vector
                ChromaDB         (Literature Space)       Retrievals
                    │                   │                   │
                    │                   │             Reciprocal Rank
                    │                   │              Fusion (k=60)
                    ▼                   ▼                   ▼
         ┌────────────────────────────────────────────────────────┐
         │             Final Retrieved Context Chunks             │
         └──────────────────────────────┬─────────────────────────┘
                                        │
                                 Groq LLM Engine
                                        │
                                        ▼
                        Answer with Verified Citations
```

### Strategy 1: Basic RAG (Direct Dense Retrieval)
- **Mechanism**: The user's query is directly embedded using `BAAI/bge-base-en-v1.5` into a 768-dimensional vector. ChromaDB executes a cosine similarity search against document chunk embeddings, returning the top-$k$ nearest neighbors.
- **Strengths**: Fastest latency (typically under 1.2s), low token cost, highly effective for straightforward keyword and concept lookups.
- **Weaknesses**: Vulnerable to the "vocabulary mismatch" problem—user queries are short and inquisitive ("How did they evaluate it?"), whereas academic chunks are long, passive, and formal ("The experimental baselines were evaluated against Squad v1.1...").

### Strategy 2: HyDE (Hypothetical Document Embeddings)
- **Mechanism**:
  1. The user query is fed to an LLM with instructions to write a hypothetical, academic-style answer passage.
  2. The LLM produces a pseudo-academic excerpt containing typical scientific jargon, structure, and phrasing.
  3. This hypothetical excerpt (not the raw query!) is embedded and used to search ChromaDB.
- **Strengths**: Bridges the semantic gap between questions and answers. Retrieves chunks that match the *form and semantics of an academic answer* rather than the phrasing of a user question.
- **Weaknesses**: Introduces additional latency (+0.8s to 1.5s) for the initial generation step; risk of drifting if the hypothetical document hallucinates erroneous terminology.

### Strategy 3: RAG-Fusion (Multi-Query Reciprocal Rank Fusion)
- **Mechanism**:
  1. The LLM expands the user's initial query into 3 to 4 orthogonal sub-queries from distinct perspectives (e.g., methodology, evaluation metrics, limitations).
  2. Each sub-query performs an independent dense vector search in parallel against ChromaDB.
  3. The ranked lists from all queries are combined and reranked using **Reciprocal Rank Fusion (RRF)**:

$$\text{RRF\_Score}(d) = \sum_{q \in Q} \frac{1}{k + r_q(d)}$$

Where:
- $Q$ is the set of generated sub-queries.
- $r_q(d)$ is the 1-based rank of document chunk $d$ in the result list for query $q$.
- $k$ is the smoothing constant (default: $k=60$), preventing high-ranked outliers from dominating.

- **Strengths**: Maximum recall and precision. Discovers cross-cutting information scattered across different sections of a paper that a single query would miss.
- **Weaknesses**: Highest latency (typically 2.0s to 3.0s) and higher token consumption.

---

## 2. Comparative Strategy Matrix

| Dimension | Basic RAG | HyDE | RAG-Fusion |
| :--- | :--- | :--- | :--- |
| **Primary Advantage** | Speed & Simplicity | High Precision for vague questions | Broad Recall across sections |
| **Average Latency** | ~1.0s – 1.4s | ~1.8s – 2.4s | ~2.4s – 3.2s |
| **LLM Calls per Query** | 1 call (final answer) | 2 calls (hypothetical doc + answer) | 2+ calls (subqueries + answer) |
| **Vector Searches** | 1 vector search | 1 vector search | 3–4 parallel vector searches |
| **Best Used For** | Factoid & definition queries | Conceptual or theoretical queries | Multi-faceted or comparative research |

---

## 3. Evaluation Metrics Defined

The **RAG Performance Benchmark** measures five objective metrics across every strategy:

### 1. Retrieval Relevance (0% – 100%)
- **What it measures**: How semantically similar the retrieved text passages are to the query intent.
- **Calculation**: Mean cosine similarity score between the query embedding and the retrieved chunk vectors:
$$\text{Relevance} = \frac{1}{|C|} \sum_{c \in C} \text{CosineSimilarity}(v_q, v_c)$$
- **Why it matters**: A low relevance score indicates the vector store returned noise or off-topic paragraphs, which dilutes LLM attention.

### 2. Context Precision (0% – 100%)
- **What it measures**: Signal-to-noise ratio in the retrieved context. Does the retrieval put the most critical passages at rank 1 rather than burying them at rank 5?
- **Why it matters**: LLMs suffer from the "Lost in the Middle" effect—they pay heavy attention to the first and last chunks and often ignore middle chunks. Higher precision ensures high-utility passages appear first.

### 3. Answer Faithfulness (0% – 100%)
- **What it measures**: The anti-hallucination metric. Are the claims made in the LLM's final response **strictly supported** by the provided context chunks?
- **Calculation**: An automated evaluation judge analyzes the generated response against the concatenated retrieved context, verifying sentence-by-sentence entailment:
$$\text{Faithfulness} = \frac{\text{Number of Claims Supported by Context}}{\text{Total Claims in Answer}}$$
- **Why it matters**: In academic literature, a model that makes up plausible numbers or claims is dangerous. Faithfulness $\ge 85\%$ guarantees grounded rigor.

### 4. Citation Validity (0% – 100%)
- **What it measures**: Whether the citations generated in the answer point to real chunks with authentic bounding box coordinates.
- **Why it matters**: Prevents "phantom citations" where a model claims information is from "Page 4" when it was actually from Page 12 or fabricated entirely.

### 5. Response Latency (Milliseconds / Seconds)
- **What it measures**: End-to-end wall-clock time from when the user presses Send to when the stream finishes or benchmark record completes.
- **Why it matters**: Allows researchers to weigh the trade-off between retrieval depth (RAG-Fusion) and rapid interactive conversation (Basic RAG).

---

## 4. How the Benchmark Lab Works

1. **Workspace Scope**: The benchmark runs inside the currently active research workspace, utilizing its ingested papers.
2. **Standardized Test Queries**: The lab executes a battery of core academic research prompts:
   - *"What is the core proposed methodology and its key advantages?"*
   - *"What dataset and experimental baselines were used for evaluation?"*
   - *"What are the stated limitations and future research directions?"*
3. **Automated Evaluation**: All three strategies run the test battery in parallel or succession, recording latency, precision, relevance, citations, and faithfulness.
4. **Interactive Dashboard**:
   - High-contrast scorecards with color-coded badges (`Emerald` $\ge 85\%$, `Amber` $\ge 70\%$, `Rose` $< 70\%$).
   - Granular breakdown audit table displaying individual run performance per query.
