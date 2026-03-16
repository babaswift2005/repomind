export type RepoStatus = 'pending' | 'analyzing' | 'ready' | 'error'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  language?: string
  size?: number
  children?: FileNode[]
}

export interface FileSummary {
  id: string
  repoId: string
  path: string
  language: string
  size: number
  summary: string
  content: string
}

export interface DependencyNode {
  id: string
  label: string
  path: string
  language: string
  x?: number
  y?: number
}

export interface DependencyEdge {
  source: string
  target: string
}

export interface DependencyGraph {
  nodes: DependencyNode[]
  edges: DependencyEdge[]
}

export interface RepoStats {
  totalFiles: number
  analyzedFiles: number
  languages: Record<string, number>
  sizeBytes: number
}

export interface RepoMeta {
  id: string
  url: string
  name: string
  owner: string
  description?: string
  explanation?: string
  fileTree?: FileNode[]
  stats?: RepoStats
  graph?: DependencyGraph
  status: RepoStatus
  error?: string
  createdAt: number
}

export interface RepoIndex {
  id: string
  name: string
  url: string
  status: RepoStatus
  createdAt: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: SourceFile[]
}

export interface SourceFile {
  path: string
  summary: string
  relevance: number
}

export interface AnalysisProgress {
  type: 'progress' | 'complete' | 'error'
  step?: string
  progress?: number
  repoId?: string
  message?: string
  /** Elapsed seconds (stopwatch) */
  elapsedSeconds?: number
  /** Estimated seconds remaining until complete */
  etaSeconds?: number
}
