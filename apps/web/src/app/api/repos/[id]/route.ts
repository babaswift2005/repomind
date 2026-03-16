import { NextRequest } from 'next/server'
import { getRepoMeta, getFileSummaries, deleteRepo } from '@/lib/storage'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const meta = getRepoMeta(params.id)
  if (!meta) {
    return Response.json({ error: 'Repository not found' }, { status: 404 })
  }

  const files = getFileSummaries(params.id)

  return Response.json({ ...meta, files })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    deleteRepo(params.id)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: 'Failed to delete repo' }, { status: 500 })
  }
}
