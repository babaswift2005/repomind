import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { analyzeRepository } from '@/lib/analyzer'
import { indexFiles } from '@/lib/embeddings'
import { addToIndex, getRepoMeta, saveRepoMeta, getFileSummaries } from '@/lib/storage'
import { extractRepoInfo } from '@/lib/utils'
import { checkOllama } from '@/lib/ollama'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { url } = body
  if (!url || typeof url !== 'string') {
    return new Response('Missing repo URL', { status: 400 })
  }

  const cleanUrl = url.trim().replace(/\.git$/, '')

  const repoInfo = extractRepoInfo(cleanUrl)
  if (!repoInfo) {
    return new Response('Invalid GitHub URL', { status: 400 })
  }

  const ollamaStatus = await checkOllama()
  if (!ollamaStatus.running) {
    return new Response(
      JSON.stringify({ error: 'Ollama is not running. Please start Ollama first.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const repoId = uuidv4()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // client disconnected
        }
      }

      try {
        addToIndex({
          id: repoId,
          name: repoInfo.name,
          url: cleanUrl,
          status: 'analyzing',
          createdAt: Date.now(),
        })

        await analyzeRepository(cleanUrl, repoId, (step, progress, extra) => {
          send({
            type: 'progress',
            step,
            progress,
            elapsedSeconds: extra?.elapsedSeconds,
            etaSeconds: extra?.etaSeconds,
          })
        })

        send({ type: 'progress', step: 'Indexing embeddings...', progress: 97 })
        const files = getFileSummaries(repoId)
        try {
          await indexFiles(repoId, files)
        } catch {
          // embeddings are optional
        }

        const meta = getRepoMeta(repoId)
        if (meta) {
          addToIndex({
            id: repoId,
            name: meta.name,
            url: cleanUrl,
            status: 'ready',
            createdAt: meta.createdAt,
          })
        }

        send({ type: 'complete', repoId })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Analysis failed'

        try {
          const meta = getRepoMeta(repoId)
          if (meta) {
            saveRepoMeta({ ...meta, status: 'error', error: message })
            addToIndex({
              id: repoId,
              name: meta.name,
              url: cleanUrl,
              status: 'error',
              createdAt: meta.createdAt,
            })
          }
        } catch {
          // ignore
        }

        send({ type: 'error', message })
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
