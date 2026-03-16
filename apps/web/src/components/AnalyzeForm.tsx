'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, Github, Clock, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { AnalysisProgress } from '@/types'

const EXAMPLE_REPOS = [
  'https://github.com/vercel/next.js',
  'https://github.com/tailwindlabs/tailwindcss',
  'https://github.com/facebook/react',
  'https://github.com/microsoft/vscode',
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AnalyzeForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isAnalyzing) return

    setError('')
    setIsAnalyzing(true)
    setProgress(2)
    setStep('Starting analysis...')
    setElapsedSeconds(0)
    setEtaSeconds(null)
    startTimeRef.current = Date.now()

    stopwatchRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? `Server error: ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as AnalysisProgress

            if (event.type === 'progress') {
              setStep(event.step ?? '')
              setProgress(event.progress ?? 0)
              if (event.elapsedSeconds != null) setElapsedSeconds(event.elapsedSeconds)
              if (event.etaSeconds != null) setEtaSeconds(event.etaSeconds)
            } else if (event.type === 'complete') {
              if (stopwatchRef.current) {
                clearInterval(stopwatchRef.current)
                stopwatchRef.current = null
              }
              setProgress(100)
              setStep('Done! Redirecting...')
              setTimeout(() => router.push(`/analyze/${event.repoId}`), 500)
              return
            } else if (event.type === 'error') {
              throw new Error(event.message ?? 'Analysis failed')
            }
          } catch (parseErr) {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsAnalyzing(false)
      setProgress(0)
      setStep('')
    } finally {
      if (stopwatchRef.current) {
        clearInterval(stopwatchRef.current)
        stopwatchRef.current = null
      }
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setIsAnalyzing(false)
    setProgress(0)
    setStep('')
    setEtaSeconds(null)
    if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current)
      stopwatchRef.current = null
    }
  }

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://github.com/owner/repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isAnalyzing}
            className="pl-9 h-11 bg-muted/50 border-border/60 text-base focus-visible:ring-primary"
          />
        </div>
        <Button
          type="submit"
          disabled={!url.trim() || isAnalyzing}
          size="lg"
          className="h-11 px-6 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white border-0"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Analyze
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {isAnalyzing && (
        <div className="space-y-3 animate-fade-in rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              {step}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground" title="Elapsed time">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(elapsedSeconds)}
              </span>
              {etaSeconds != null && etaSeconds > 0 && (
                <span className="flex items-center gap-1.5 text-primary" title="Estimated time left">
                  <Timer className="h-3.5 w-3.5" />
                  ~{formatTime(etaSeconds)} left
                </span>
              )}
              <span className="text-muted-foreground tabular-nums">{progress}%</span>
              <button
                onClick={handleCancel}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Cancel
              </button>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Timeline</span>
            <span>
              {formatTime(elapsedSeconds)} elapsed
              {etaSeconds != null && etaSeconds > 0 && ` · ~${formatTime(etaSeconds)} remaining`}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <span className="text-xs text-muted-foreground">Try:</span>
        {EXAMPLE_REPOS.map((repo) => {
          const name = repo.split('/').slice(-2).join('/')
          return (
            <button
              key={repo}
              onClick={() => setUrl(repo)}
              disabled={isAnalyzing}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
