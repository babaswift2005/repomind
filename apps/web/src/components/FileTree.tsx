'use client'

import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getLanguageColor, formatBytes } from '@/lib/utils'
import type { FileNode, FileSummary } from '@/types'

interface FileTreeProps {
  nodes: FileNode[]
  files: FileSummary[]
}

interface FileTreeNodeProps {
  node: FileNode
  depth: number
  files: FileSummary[]
  selectedPath: string | null
  onSelect: (path: string) => void
  filterText: string
}

function matchesFilter(node: FileNode, filter: string): boolean {
  if (!filter) return true
  if (node.name.toLowerCase().includes(filter)) return true
  if (node.children) return node.children.some((c) => matchesFilter(c, filter))
  return false
}

function FileTreeNode({ node, depth, files, selectedPath, onSelect, filterText }: FileTreeNodeProps) {
  const [open, setOpen] = useState(depth < 2)

  if (filterText && !matchesFilter(node, filterText.toLowerCase())) return null

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-muted/60 transition-colors text-left"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          )}
          <span className="truncate font-medium text-foreground/90">{node.name}</span>
        </button>
        {open && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                files={files}
                selectedPath={selectedPath}
                onSelect={onSelect}
                filterText={filterText}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const isSelected = selectedPath === node.path
  const hasSummary = files.some((f) => f.path === node.path)
  const dotColor = getLanguageColor(node.language ?? '')

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors text-left ${
        isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
      }`}
      style={{ paddingLeft: `${8 + depth * 16}px` }}
    >
      <File className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate flex-1">{node.name}</span>
      {node.language && (
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
          title={node.language}
        />
      )}
      {hasSummary && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="AI summary available" />
      )}
    </button>
  )
}

export function FileTree({ nodes, files }: FileTreeProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const selectedFile = files.find((f) => f.path === selectedPath)

  return (
    <div className="flex gap-4 h-[600px]">
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <ScrollArea className="flex-1 rounded-lg border border-border/60 bg-muted/20">
          <div className="p-1">
            {nodes.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                depth={0}
                files={files}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
                filterText={filter}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
        {selectedFile ? (
          <FileSummaryPanel file={selectedFile} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            <div className="text-center space-y-2">
              <File className="h-8 w-8 mx-auto opacity-30" />
              <p>Select a file to view its AI summary</p>
              <p className="text-xs opacity-60">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                Green dot = AI summary available
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FileSummaryPanel({ file }: { file: FileSummary }) {
  const [showCode, setShowCode] = useState(false)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono text-foreground/90 truncate">{file.path}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs">
            {file.language}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {formatBytes(file.size)}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              AI Summary
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{file.summary}</p>
          </div>

          <div>
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-xs text-primary hover:underline"
            >
              {showCode ? 'Hide' : 'Show'} source code
            </button>

            {showCode && (
              <div className="mt-2 rounded-lg bg-zinc-950 border border-border/40 overflow-auto max-h-96">
                <pre className="p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words">
                  {file.content}
                </pre>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
