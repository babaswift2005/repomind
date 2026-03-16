'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface OllamaStatusState {
  loading: boolean
  running: boolean
  models: Array<{ name: string }>
}

export function OllamaStatus() {
  const [status, setStatus] = useState<OllamaStatusState>({ loading: true, running: false, models: [] })

  useEffect(() => {
    fetch('/api/ollama-check')
      .then((r) => r.json())
      .then((data) => setStatus({ loading: false, running: data.running, models: data.models ?? [] }))
      .catch(() => setStatus({ loading: false, running: false, models: [] }))
  }, [])

  if (status.loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking Ollama...
      </div>
    )
  }

  if (!status.running) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Ollama is not running</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start Ollama and pull the required models:
            </p>
            <div className="mt-2 rounded bg-muted p-2 font-mono text-xs space-y-1">
              <div>$ ollama serve</div>
              <div>$ ollama pull llama3.2</div>
              <div>$ ollama pull nomic-embed-text</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasLlm = status.models.some((m) => m.name.includes('llama') || m.name.includes('mistral') || m.name.includes('codellama') || m.name.includes('deepseek'))
  const hasEmbed = status.models.some((m) => m.name.includes('embed') || m.name.includes('nomic'))

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5 text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ollama running
      </div>
      {!hasLlm && (
        <div className="text-amber-400 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          Pull a chat model: <code className="font-mono ml-1">ollama pull llama3.2</code>
        </div>
      )}
      {!hasEmbed && (
        <div className="text-amber-400 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          Pull embed model: <code className="font-mono ml-1">ollama pull nomic-embed-text</code>
        </div>
      )}
      {hasLlm && hasEmbed && (
        <div className="text-muted-foreground">
          {status.models.length} model{status.models.length !== 1 ? 's' : ''} available
        </div>
      )}
    </div>
  )
}
