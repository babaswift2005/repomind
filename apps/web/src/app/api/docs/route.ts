import { NextRequest } from 'next/server'
import { getRepoMeta, getFileSummaries } from '@/lib/storage'
import { generateReadme, generateOnboardingDocs, generateArchitectureDocs } from '@/lib/docs'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  let body: { repoId?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { repoId, type = 'readme' } = body

  if (!repoId) {
    return new Response('Missing repoId', { status: 400 })
  }

  const meta = getRepoMeta(repoId)
  if (!meta) {
    return Response.json({ error: 'Repository not found' }, { status: 404 })
  }

  const files = getFileSummaries(repoId)

  try {
    let content: string

    switch (type) {
      case 'onboarding':
        content = await generateOnboardingDocs(meta, files)
        break
      case 'architecture':
        content = await generateArchitectureDocs(meta, files)
        break
      default:
        content = await generateReadme(meta, files)
    }

    return Response.json({ content })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
