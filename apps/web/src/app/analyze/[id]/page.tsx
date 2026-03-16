'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Brain,
  ExternalLink,
  AlertCircle,
  GitBranch,
  MessageSquare,
  FileText,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RepoOverview } from '@/components/RepoOverview'
import { FileTree } from '@/components/FileTree'
import { ChatInterface } from '@/components/ChatInterface'
import { DependencyGraph } from '@/components/DependencyGraph'
import { DocGenerator } from '@/components/DocGenerator'
import { Skeleton } from '@/components/ui/skeleton'
import type { RepoMeta, FileSummary } from '@/types'

interface PageData extends RepoMeta {
  files: FileSummary[]
}

export default function AnalyzePage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Missing repository ID')
      return
    }
    fetch(`/api/repos/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (!id) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Invalid page</h1>
        <p className="text-muted-foreground mb-6">Missing repository ID.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    )
  }
  if (loading) return <LoadingSkeleton />

  if (error || !data) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Repository not found</h1>
        <p className="text-muted-foreground mb-6">{error ?? 'This repository could not be loaded.'}</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </Button>
      </div>
    )
  }

  if (data.status === 'error') {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Analysis failed</h1>
        <p className="text-muted-foreground mb-2">{data.error}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Make sure Ollama is running and the repository URL is public.
        </p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Try another repo
          </Link>
        </Button>
      </div>
    )
  }

  const repoFullName = data.owner ? `${data.owner}/${data.name}` : data.name

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
        <Button asChild variant="ghost" size="sm" className="self-start -ml-2 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>

        <div className="flex-1 sm:ml-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">{repoFullName}</h1>
            </div>
            <Badge variant="success" className="text-xs">Analyzed</Badge>
            {data.stats && (
              <span className="text-xs text-muted-foreground">
                {data.stats.analyzedFiles} files · {Object.keys(data.stats.languages).length} languages
              </span>
            )}
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:flex gap-0 sm:gap-0 h-auto sm:h-9 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Files</span>
          </TabsTrigger>
          <TabsTrigger value="graph" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <GitBranch className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Architecture</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <RepoOverview meta={data} />
          </TabsContent>

          <TabsContent value="files">
            {data.fileTree && data.files ? (
              <FileTree nodes={data.fileTree} files={data.files} />
            ) : (
              <EmptyState icon={<FileText />} text="No file data available" />
            )}
          </TabsContent>

          <TabsContent value="graph">
            {data.graph ? (
              <DependencyGraph graph={data.graph} />
            ) : (
              <EmptyState icon={<GitBranch />} text="No dependency graph available" />
            )}
          </TabsContent>

          <TabsContent value="chat">
            <ChatInterface repoId={data.id} repoName={repoFullName} />
          </TabsContent>

          <TabsContent value="docs">
            <DocGenerator repoId={data.id} repoName={repoFullName} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-border/60 text-muted-foreground">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 mx-auto opacity-30">{icon}</div>
        <p className="text-sm">{text}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-10 w-full sm:w-96" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
