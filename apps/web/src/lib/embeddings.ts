import { embed, cosineSimilarity } from './ollama'
import { saveEmbeddings, getEmbeddings, type EmbeddingRecord } from './storage'
import type { FileSummary, SourceFile } from '@/types'

const CHUNK_SIZE = 1200
const CHUNK_OVERLAP = 200

export function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + size, text.length)
    chunks.push(text.slice(start, end))
    if (end === text.length) break
    start = end - overlap
  }

  return chunks
}

export async function indexFiles(repoId: string, files: FileSummary[]): Promise<void> {
  const records: EmbeddingRecord[] = []

  for (const file of files) {
    const textToEmbed = `File: ${file.path}\nSummary: ${file.summary}\n\n${file.content}`
    const chunks = chunkText(textToEmbed)

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await embed(chunks[i])
        records.push({
          fileId: file.id,
          filePath: file.path,
          chunkIndex: i,
          chunkText: chunks[i].slice(0, 500),
          embedding,
        })
      } catch {
        // skip if embedding fails
      }
    }
  }

  saveEmbeddings(repoId, records)
}

export async function semanticSearch(
  repoId: string,
  query: string,
  topK = 5
): Promise<SourceFile[]> {
  const embeddings = getEmbeddings(repoId)
  if (embeddings.length === 0) return []

  let queryEmbedding: number[]
  try {
    queryEmbedding = await embed(query)
  } catch {
    return []
  }

  const scored = embeddings.map((record) => ({
    ...record,
    score: cosineSimilarity(queryEmbedding, record.embedding),
  }))

  scored.sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const results: SourceFile[] = []

  for (const item of scored) {
    if (results.length >= topK) break
    if (seen.has(item.filePath)) continue
    seen.add(item.filePath)

    results.push({
      path: item.filePath,
      summary: item.chunkText,
      relevance: Math.round(item.score * 100),
    })
  }

  return results
}
