'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Trash2, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { RepoIndex, RepoStatus } from '@/types'

export function RepoHistory() {
  const [repos, setRepos] = useState<RepoIndex[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/repos')
      const data = await res.json()
      setRepos(Array.isArray(data) ? data : [])
    } catch {
      setRepos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepos()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    await fetch(`/api/repos/${id}`, { method: 'DELETE' })
    setRepos((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading history...
      </div>
    )
  }

  if (repos.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Recent Analyses</span>
      </div>
      <div className="space-y-2">
        {repos.slice(0, 6).map((repo) => (
          <div
            key={repo.id}
            className="group flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 hover:border-border transition-colors"
          >
            <StatusIcon status={repo.status} />
            <div className="flex-1 min-w-0">
              <Link
                href={repo.status === 'ready' ? `/analyze/${repo.id}` : '#'}
                className="text-sm font-medium hover:text-primary transition-colors truncate block"
              >
                {repo.name}
              </Link>
              <p className="text-xs text-muted-foreground truncate">{formatDate(repo.createdAt)}</p>
            </div>
            <StatusBadge status={repo.status} />
            {repo.status === 'ready' && (
              <Link href={`/analyze/${repo.id}`}>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
              </Link>
            )}
            <button
              onClick={(e) => handleDelete(repo.id, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: RepoStatus }) {
  switch (status) {
    case 'ready':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
    default:
      return <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
  }
}

function StatusBadge({ status }: { status: RepoStatus }) {
  switch (status) {
    case 'ready':
      return <Badge variant="success" className="text-xs">Ready</Badge>
    case 'error':
      return <Badge variant="destructive" className="text-xs">Error</Badge>
    case 'analyzing':
      return <Badge variant="info" className="text-xs">Analyzing</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">Pending</Badge>
  }
}
