import { checkOllama } from '@/lib/ollama'

export async function GET() {
  const status = await checkOllama()
  return Response.json(status)
}
