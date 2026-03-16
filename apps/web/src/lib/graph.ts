import fs from 'fs'
import path from 'path'
import { detectLanguage } from './utils'
import type { DependencyGraph, DependencyNode, DependencyEdge } from '@/types'

const IMPORT_PATTERNS: Record<string, RegExp[]> = {
  TypeScript: [
    /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  JavaScript: [
    /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  Python: [
    /from\s+(\.{0,2}[\w.]+)\s+import/g,
    /import\s+([\w.]+)/g,
  ],
  Go: [
    /import\s+"([^"]+)"/g,
    /import\s+\w+\s+"([^"]+)"/g,
  ],
  Rust: [
    /use\s+([\w:]+)/g,
    /mod\s+(\w+)/g,
  ],
}

export function buildDependencyGraph(
  repoRoot: string,
  filePaths: string[]
): DependencyGraph {
  const relPaths = filePaths.map((fp) => path.relative(repoRoot, fp).replace(/\\/g, '/'))
  const pathSet = new Set(relPaths)

  const nodes: DependencyNode[] = relPaths.map((rp) => ({
    id: rp,
    label: path.basename(rp),
    path: rp,
    language: detectLanguage(rp),
  }))

  const edges: DependencyEdge[] = []
  const edgeSet = new Set<string>()

  for (let i = 0; i < filePaths.length; i++) {
    const fullPath = filePaths[i]
    const relPath = relPaths[i]
    const language = detectLanguage(fullPath)

    let content: string
    try {
      content = fs.readFileSync(fullPath, 'utf-8')
    } catch {
      continue
    }

    const patterns = IMPORT_PATTERNS[language] ?? IMPORT_PATTERNS['TypeScript']
    const imports = extractImports(content, patterns)

    for (const imp of imports) {
      if (!imp.startsWith('.')) continue

      const resolved = resolveRelativeImport(relPath, imp, relPaths)
      if (!resolved || !pathSet.has(resolved)) continue

      const edgeKey = `${relPath}->${resolved}`
      if (edgeSet.has(edgeKey) || relPath === resolved) continue

      edgeSet.add(edgeKey)
      edges.push({ source: relPath, target: resolved })
    }
  }

  return { nodes, edges }
}

function extractImports(content: string, patterns: RegExp[]): string[] {
  const imports: string[] = []

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) imports.push(match[1])
    }
  }

  return imports
}

function resolveRelativeImport(
  fromPath: string,
  importPath: string,
  allPaths: string[]
): string | null {
  const fromDir = path.dirname(fromPath)
  const resolved = path.join(fromDir, importPath).replace(/\\/g, '/')

  // Try exact match
  if (allPaths.includes(resolved)) return resolved

  // Try with extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.svelte']
  for (const ext of extensions) {
    const withExt = resolved + ext
    if (allPaths.includes(withExt)) return withExt
  }

  // Try index files
  for (const ext of extensions) {
    const index = `${resolved}/index${ext}`
    if (allPaths.includes(index)) return index
  }

  return null
}
