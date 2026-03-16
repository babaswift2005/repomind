import fs from 'fs'
import path from 'path'
import type { RepoMeta, RepoIndex, FileSummary } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const REPOS_DIR = path.join(DATA_DIR, 'repos')
const INDEX_FILE = path.join(DATA_DIR, 'index.json')

function ensureDirs() {
  fs.mkdirSync(REPOS_DIR, { recursive: true })
}

export function getRepoDir(repoId: string): string {
  return path.join(REPOS_DIR, repoId)
}

export function getCloneDir(repoId: string): string {
  return path.join(DATA_DIR, 'clones', repoId)
}

export function saveRepoMeta(meta: RepoMeta): void {
  ensureDirs()
  const dir = getRepoDir(meta.id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8')
}

export function getRepoMeta(repoId: string): RepoMeta | null {
  const file = path.join(getRepoDir(repoId), 'meta.json')
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return null
  }
}

export function saveFileSummaries(repoId: string, files: FileSummary[]): void {
  ensureDirs()
  const dir = getRepoDir(repoId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'files.json'), JSON.stringify(files, null, 2), 'utf-8')
}

export function getFileSummaries(repoId: string): FileSummary[] {
  const file = path.join(getRepoDir(repoId), 'files.json')
  if (!fs.existsSync(file)) return []
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return []
  }
}

export interface EmbeddingRecord {
  fileId: string
  filePath: string
  chunkIndex: number
  chunkText: string
  embedding: number[]
}

export function saveEmbeddings(repoId: string, embeddings: EmbeddingRecord[]): void {
  ensureDirs()
  const dir = getRepoDir(repoId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'embeddings.json'), JSON.stringify(embeddings, null, 2), 'utf-8')
}

export function getEmbeddings(repoId: string): EmbeddingRecord[] {
  const file = path.join(getRepoDir(repoId), 'embeddings.json')
  if (!fs.existsSync(file)) return []
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return []
  }
}

export function addToIndex(entry: RepoIndex): void {
  ensureDirs()
  const repos = getIndex()
  const existing = repos.findIndex((r) => r.id === entry.id)
  if (existing >= 0) {
    repos[existing] = entry
  } else {
    repos.unshift(entry)
  }
  fs.writeFileSync(INDEX_FILE, JSON.stringify(repos, null, 2), 'utf-8')
}

export function getIndex(): RepoIndex[] {
  if (!fs.existsSync(INDEX_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function deleteRepo(repoId: string): void {
  const repoDir = getRepoDir(repoId)
  const cloneDir = getCloneDir(repoId)

  if (fs.existsSync(repoDir)) {
    fs.rmSync(repoDir, { recursive: true, force: true })
  }
  if (fs.existsSync(cloneDir)) {
    fs.rmSync(cloneDir, { recursive: true, force: true })
  }

  const repos = getIndex().filter((r) => r.id !== repoId)
  fs.writeFileSync(INDEX_FILE, JSON.stringify(repos, null, 2), 'utf-8')
}
