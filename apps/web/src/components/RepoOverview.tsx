'use client'

import { ExternalLink, GitBranch, FileCode2, Languages, HardDrive } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatBytes, getLanguageColor } from '@/lib/utils'
import type { RepoMeta } from '@/types'

interface RepoOverviewProps {
  meta: RepoMeta
}

export function RepoOverview({ meta }: RepoOverviewProps) {
  const topLanguages = meta.stats
    ? Object.entries(meta.stats.languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <a
          href={meta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {meta.url}
        </a>
      </div>

      {meta.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<FileCode2 className="h-4 w-4" />}
            label="Files Analyzed"
            value={`${meta.stats.analyzedFiles} / ${meta.stats.totalFiles}`}
          />
          <StatCard
            icon={<Languages className="h-4 w-4" />}
            label="Languages"
            value={String(Object.keys(meta.stats.languages).length)}
          />
          <StatCard
            icon={<HardDrive className="h-4 w-4" />}
            label="Repo Size"
            value={formatBytes(meta.stats.sizeBytes)}
          />
          <StatCard
            icon={<GitBranch className="h-4 w-4" />}
            label="Top Language"
            value={topLanguages[0]?.[0] ?? 'Unknown'}
          />
        </div>
      )}

      {topLanguages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Languages</p>
          <div className="flex flex-wrap gap-2">
            {topLanguages.map(([lang, count]) => (
              <div
                key={lang}
                className="flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-xs"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getLanguageColor(lang) }}
                />
                {lang}
                <span className="text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {meta.explanation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm prose-invert max-w-none text-muted-foreground leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {meta.explanation}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
