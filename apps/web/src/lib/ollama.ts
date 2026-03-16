const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const DEFAULT_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export async function checkOllama(): Promise<{ running: boolean; models: OllamaModel[] }> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return { running: false, models: [] }
    const data = await response.json()
    return { running: true, models: data.models ?? [] }
  } catch {
    return { running: false, models: [] }
  }
}

export async function generate(
  prompt: string,
  options: {
    model?: string
    system?: string
    temperature?: number
  } = {}
): Promise<string> {
  const { model = DEFAULT_MODEL, system, temperature = 0.3 } = options

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: false,
      options: { temperature },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Ollama generate failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return data.response as string
}

export async function* generateStream(
  prompt: string,
  options: {
    model?: string
    system?: string
    temperature?: number
  } = {}
): AsyncGenerator<string> {
  const { model = DEFAULT_MODEL, system, temperature = 0.5 } = options

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: true,
      options: { temperature },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama stream failed (${response.status})`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(Boolean)

    for (const line of lines) {
      try {
        const data = JSON.parse(line)
        if (data.response) yield data.response
        if (data.done) return
      } catch {
        // skip malformed JSON lines
      }
    }
  }
}

export async function embed(text: string, model = DEFAULT_EMBED_MODEL): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text }),
  })

  if (!response.ok) {
    throw new Error(`Ollama embed failed (${response.status})`)
  }

  const data = await response.json()
  return data.embedding as number[]
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
