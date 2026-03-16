'use client'

import { useState } from 'react'
import { FileText, Loader2, Download, Copy, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DocGeneratorProps {
  repoId: string
  repoName: string
}

type DocType = 'readme' | 'onboarding' | 'architecture'

const DOC_TYPES: Array<{ id: DocType; label: string; description: string }> = [
  { id: 'readme', label: 'README.md', description: 'Professional README with installation, usage & contributing' },
  { id: 'onboarding', label: 'Onboarding Guide', description: 'New contributor guide with architecture walkthrough' },
  { id: 'architecture', label: 'Architecture Docs', description: 'Technical system design and component documentation' },
]

export function DocGenerator({ repoId, repoName }: DocGeneratorProps) {
  const [activeType, setActiveType] = useState<DocType>('readme')
  const [docs, setDocs] = useState<Record<DocType, string>>({
    readme: '',
    onboarding: '',
    architecture: '',
  })
  const [loading, setLoading] = useState<DocType | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = async (type: DocType) => {
    setLoading(type)
    setActiveType(type)
    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId, type }),
      })
      const data = await res.json()
      if (data.content) {
        setDocs((prev) => ({ ...prev, [type]: data.content }))
      }
    } catch (err) {
      console.error('Doc generation failed:', err)
    } finally {
      setLoading(null)
    }
  }

  const handleCopy = async () => {
    const content = docs[activeType]
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const content = docs[activeType]
    if (!content) return
    const names: Record<DocType, string> = {
      readme: 'README.md',
      onboarding: 'ONBOARDING.md',
      architecture: 'ARCHITECTURE.md',
    }
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = names[activeType]
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeContent = docs[activeType]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DOC_TYPES.map((dt) => (
          <Card
            key={dt.id}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              activeType === dt.id ? 'border-primary/60 bg-primary/5' : ''
            }`}
            onClick={() => {
              setActiveType(dt.id)
              if (!docs[dt.id] && loading !== dt.id) generate(dt.id)
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className={`h-4 w-4 ${activeType === dt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${activeType === dt.id ? 'text-primary' : ''}`}>
                    {dt.label}
                  </span>
                </div>
                {loading === dt.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{dt.description}</p>
              {!docs[dt.id] && loading !== dt.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs w-full"
                  onClick={(e) => { e.stopPropagation(); generate(dt.id) }}
                >
                  Generate
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loading === activeType && (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Generating {DOC_TYPES.find((d) => d.id === activeType)?.label}...</span>
        </div>
      )}

      {activeContent && (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 bg-muted/20">
            <span className="text-sm font-medium">
              {DOC_TYPES.find((d) => d.id === activeType)?.label}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
                {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-auto p-6">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {!activeContent && !loading && (
        <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
          <div className="text-center space-y-3">
            <FileText className="h-8 w-8 mx-auto opacity-30" />
            <p>Click Generate on a document type above</p>
          </div>
        </div>
      )}
    </div>
  )
}
