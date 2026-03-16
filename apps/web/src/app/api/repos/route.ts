import { NextRequest } from 'next/server'
import { getIndex } from '@/lib/storage'

export async function GET() {
  try {
    const repos = getIndex()
    return Response.json(repos)
  } catch (error) {
    return Response.json({ error: 'Failed to list repos' }, { status: 500 })
  }
}
