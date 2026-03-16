import { NextRequest } from 'next/server'
import { semanticSearch } from '@/lib/embeddings'
import { generateStream } from '@/lib/ollama'
import { getRepoMeta, getFileSummaries } from '@/lib/storage'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  let body: { repoId?: string; message?: string; history?: Array<{ role: string; content: string }> }
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { repoId, message, history = [] } = body

  if (!repoId || !message) {
    return new Response('Missing repoId or message', { status: 400 })
  }

  const meta = getRepoMeta(repoId)
  if (!meta) {
    return new Response('Repository not found', { status: 404 })
  }

  // Semantic search for relevant context
  const sources = await semanticSearch(repoId, message, 5)

  // Fall back to file summaries if no embeddings
  let contextText = ''
  if (sources.length > 0) {
    contextText = sources
      .map((s) => `File: ${s.path} (relevance: ${s.relevance}%)\n${s.summary}`)
      .join('\n\n---\n\n')
  } else {
    const files = getFileSummaries(repoId)
    const relevant = files.slice(0, 8)
    contextText = relevant
      .map((f) => `File: ${f.path} (${f.language})\n${f.summary}`)
      .join('\n\n---\n\n')
  }

  const systemPrompt = `You are an expert code assistant analyzing the GitHub repository: ${meta.owner}/${meta.name}.

Repository Overview:
${meta.explanation ?? 'A software repository'}

You have access to the following relevant code context:

${contextText}

Answer questions about this codebase accurately and helpfully. 
- Reference specific files and code patterns when relevant
- Be concise but thorough
- Use code examples when helpful
- If you're unsure about something, say so`

  const conversationHistory = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
    .join('\n')

  const prompt = conversationHistory
    ? `${conversationHistory}\n\nHuman: ${message}\n\nAssistant:`
    : message

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sourcesPayload = JSON.stringify({ sources })
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`))

      try {
        for await (const chunk of generateStream(prompt, { system: systemPrompt, temperature: 0.5 })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`))
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Generation failed'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`))
      } finally {
        try {
          controller.close()
        } catch {
          // ignore
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
