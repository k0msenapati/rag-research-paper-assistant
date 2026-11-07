export interface Workspace {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  document_count: number
  conversation_count: number
}

export interface DocumentItem {
  id: string
  workspace_id: string
  title: string
  file_name: string
  file_path: string
  file_hash: string
  arxiv_id?: string | null
  total_pages: number
  chunk_count: number
  status: 'ready' | 'processing' | 'failed'
  created_at: string
}

export interface ChunkItem {
  id: string
  document_id: string
  page_number: number
  chunk_index: number
  text: string
  bounding_box: [number, number, number, number] // [ymin, xmin, ymax, xmax] percentages
}

export interface Citation {
  id: string
  citation_index: number
  document_id: string
  document_title?: string | null
  chunk_id: string
  page_number: number
  quoted_text: string
  bounding_box: [number, number, number, number] // [ymin, xmin, ymax, xmax] percentages
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  rag_strategy: 'basic' | 'hyde' | 'fusion'
  latency_ms: number
  created_at: string
  citations?: Citation[]
}

export interface Conversation {
  id: string
  workspace_id: string
  title: string
  rag_strategy: 'basic' | 'hyde' | 'fusion'
  llm_model: string
  created_at: string
  messages: Message[]
}

export interface ChatRequestPayload {
  workspace_id: string
  conversation_id?: string | null
  query: string
  rag_strategy: 'basic' | 'hyde' | 'fusion'
  llm_model?: string | null
  document_ids?: string[]
  top_k?: number
  rrf_k?: number
}

export interface ArxivPaper {
  arxiv_id: string
  title: string
  authors: string[]
  summary: string
  published: string
  updated: string
  pdf_url: string
  primary_category: string
  categories: string[]
}

export interface SummaryData {
  document_id: string
  document_title: string
  objective: string
  problem: string
  methodology: string
  models_and_technologies: string
  dataset: string
  results: string
  limitations: string
  future_scope: string
  citations: Citation[]
}

export interface ComparisonRow {
  aspect: string
  paper_analyses: Record<string, string>
}

export interface ComparisonData {
  documents: Array<{ id: string; title: string }>
  comparison_table: ComparisonRow[]
  synthesis: string
  citations: Citation[]
}

export interface LitReviewData {
  topic: string
  synthesis: string
  review_matrix: Array<Record<string, string>>
  citations: Citation[]
}

export interface StrategyMetric {
  strategy: 'basic' | 'hyde' | 'fusion'
  retrieval_relevance: number
  context_precision: number
  answer_faithfulness: number
  faithfulness?: number
  citation_validity: number
  average_latency_ms: number
}

export interface EvaluationData {
  workspace_id: string
  total_evaluations: number
  metrics: StrategyMetric[]
  detailed_results: Array<{
    query: string
    strategy: string
    latency_ms: number
    faithfulness?: number
    answer_faithfulness?: number
    relevance?: number
    retrieval_relevance?: number
    citation_count?: number
    citation_validity?: number
  }>
}
