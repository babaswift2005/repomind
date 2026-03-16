import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import simpleGit from 'simple-git'
import { generate } from './ollama'
import { saveRepoMeta, saveFileSummaries, getCloneDir } from './storage'
import { buildDependencyGraph } from './graph'
import { detectLanguage, extractRepoInfo } from './utils'
import type { FileNode, FileSummary, RepoMeta, RepoStats } from '@/types'

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out',
  '__pycache__', '.venv', 'venv', 'env', 'vendor', 'target',
  '.idea', '.vscode', 'coverage', '.nyc_output', '.turbo',
  'public', 'assets', 'static', 'images', 'fonts',
])

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.mp3', '.wav', '.ogg', '.webm',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.lock', '.log',
  '.min.js', '.min.css',
])

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h', '.hpp',
  '.cs', '.rb', '.php', '.swift', '.kt', '.scala',
  '.vue', '.svelte', '.astro',
  '.md', '.mdx', '.json', '.yaml', '.yml', '.toml',
  '.env.example', '.css', '.scss',
  '.sh', '.bash', '.zsh', '.fish',
  '.sql', '.graphql', '.proto',
  '.dockerfile', '.tf', '.hcl',
])

const MAX_FILE_SIZE = 60 * 1024
const MAX_FILES = parseInt(process.env.MAX_ANALYZE_FILES || '80', 10)

export type ProgressCallback = (
  step: string,
  progress: number,
  extra?: { elapsedSeconds: number; etaSeconds?: number }
) => void

export async function analyzeRepository(
  repoUrl: string,
  repoId: string,
  onProgress: ProgressCallback
): Promise<void> {
  const repoInfo = extractRepoInfo(repoUrl)
  const repoName = repoInfo ? `${repoInfo.owner}/${repoInfo.name}` : repoUrl

  const initialMeta: RepoMeta = {
    id: repoId,
    url: repoUrl,
    name: repoInfo?.name ?? repoUrl,
    owner: repoInfo?.owner ?? '',
    status: 'analyzing',
    createdAt: Date.now(),
  }
  saveRepoMeta(initialMeta)

  const startTime = Date.now()

  onProgress('Cloning repository...', 5)
  const cloneDir = getCloneDir(repoId)
  await cloneRepository(repoUrl, cloneDir)

  onProgress('Scanning file structure...', 18)
  const fileTree = buildFileTree(cloneDir, cloneDir)
  const codeFiles = getAllCodeFiles(cloneDir)
  const filesToAnalyze = codeFiles.slice(0, MAX_FILES)

  const fileSummaries: FileSummary[] = []
  const fileTimes: number[] = []

  for (let i = 0; i < filesToAnalyze.length; i++) {
    const fileStart = Date.now()
    const filePath = filesToAnalyze[i]
    const pct = 20 + Math.floor((i / filesToAnalyze.length) * 48)
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000)

    let etaSeconds: number | undefined
    if (fileTimes.length > 0) {
      const avgPerFile = fileTimes.reduce((a, b) => a + b, 0) / fileTimes.length
      const remaining = filesToAnalyze.length - i
      etaSeconds = Math.round((avgPerFile / 1000) * remaining)
    }

    onProgress(`Summarizing files (${i + 1}/${filesToAnalyze.length})...`, pct, {
      elapsedSeconds,
      etaSeconds,
    })

    try {
      const summary = await summarizeFile(filePath, cloneDir, repoId)
      if (summary) fileSummaries.push(summary)
    } catch {
      // skip files that fail
    }
    fileTimes.push(Date.now() - fileStart)
  }

  saveFileSummaries(repoId, fileSummaries)

  onProgress('Generating repository overview...', 72, {
    elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
  })
  const explanation = await generateRepoExplanation(repoName, fileSummaries, fileTree)

  onProgress('Building dependency graph...', 82, {
    elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
  })
  const graph = buildDependencyGraph(cloneDir, filesToAnalyze)

  const stats: RepoStats = {
    totalFiles: codeFiles.length,
    analyzedFiles: fileSummaries.length,
    languages: getLanguageStats(filesToAnalyze),
    sizeBytes: getDirSize(cloneDir),
  }

  onProgress('Saving analysis...', 95, {
    elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
  })
  const finalMeta: RepoMeta = {
    ...initialMeta,
    name: repoInfo?.name ?? repoUrl,
    owner: repoInfo?.owner ?? '',
    explanation,
    fileTree,
    stats,
    graph,
    status: 'ready',
  }
  saveRepoMeta(finalMeta)

  onProgress('Done!', 100, {
    elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
  })
}

async function cloneRepository(url: string, targetDir: string): Promise<void> {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true })
  }
  fs.mkdirSync(targetDir, { recursive: true })

  const git = simpleGit()
  await git.clone(url, targetDir, ['--depth', '1', '--single-branch'])
}

function buildFileTree(dirPath: string, rootPath: string): FileNode[] {
  const nodes: FileNode[] = []

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return nodes
  }

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue

    const fullPath = path.join(dirPath, entry.name)
    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/')

    if (entry.isDirectory()) {
      const children = buildFileTree(fullPath, rootPath)
      if (children.length > 0) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children,
        })
      }
    } else if (entry.isFile()) {
      const ext = getExtension(entry.name)
      if (IGNORED_EXTENSIONS.has(ext)) continue

      let size = 0
      try {
        size = fs.statSync(fullPath).size
      } catch {
        // ignore
      }

      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
        language: detectLanguage(entry.name),
        size,
      })
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function getAllCodeFiles(dirPath: string): string[] {
  const files: string[] = []
  collectFiles(dirPath, files)
  return files
}

function collectFiles(dirPath: string, acc: string[]): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue
    if (entry.name.startsWith('.') && !entry.name.includes('.env')) continue

    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      collectFiles(fullPath, acc)
    } else if (entry.isFile()) {
      const ext = getExtension(entry.name)
      if (!CODE_EXTENSIONS.has(ext)) continue

      try {
        const stat = fs.statSync(fullPath)
        if (stat.size > MAX_FILE_SIZE) continue
      } catch {
        continue
      }

      acc.push(fullPath)
    }
  }
}

async function summarizeFile(
  filePath: string,
  repoRoot: string,
  repoId: string
): Promise<FileSummary | null> {
  let content: string
  try {
    content = fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }

  if (content.trim().length < 10) return null

  const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/')
  const language = detectLanguage(filePath)

  const truncated = content.slice(0, 3000)

  const prompt = `Summarize this ${language} file concisely in 2-4 sentences. Focus on what it does and its role in the project.

File: ${relativePath}
\`\`\`${language.toLowerCase()}
${truncated}
\`\`\`

Summary:`

  try {
    const summary = await generate(prompt, { temperature: 0.2 })
    return {
      id: uuidv4(),
      repoId,
      path: relativePath,
      language,
      size: Buffer.byteLength(content, 'utf-8'),
      summary: summary.trim(),
      content: content.slice(0, 8000),
    }
  } catch {
    return {
      id: uuidv4(),
      repoId,
      path: relativePath,
      language,
      size: Buffer.byteLength(content, 'utf-8'),
      summary: `${language} file: ${relativePath}`,
      content: content.slice(0, 8000),
    }
  }
}

async function generateRepoExplanation(
  repoName: string,
  files: FileSummary[],
  fileTree: FileNode[]
): Promise<string> {
  const topFiles = files.slice(0, 20)
  const fileSummaryText = topFiles
    .map((f) => `- ${f.path} (${f.language}): ${f.summary}`)
    .join('\n')

  const rootFiles = fileTree
    .filter((n) => n.type === 'file')
    .map((n) => n.name)
    .join(', ')

  const prompt = `You are analyzing a GitHub repository called "${repoName}".

Root-level files: ${rootFiles}

Key files analyzed:
${fileSummaryText}

Write a comprehensive explanation of this repository covering:
1. What the project does and its purpose
2. Key technologies and frameworks used
3. Project architecture and structure
4. Main features and capabilities
5. How to get started

Write in a clear, engaging style suitable for developers discovering this project for the first time.`

  try {
    return await generate(prompt, { temperature: 0.4 })
  } catch {
    return `Repository: ${repoName}\n\nThis repository contains ${files.length} analyzed files across multiple languages.`
  }
}

function getLanguageStats(filePaths: string[]): Record<string, number> {
  const stats: Record<string, number> = {}
  for (const fp of filePaths) {
    const lang = detectLanguage(fp)
    stats[lang] = (stats[lang] ?? 0) + 1
  }
  return stats
}

function getDirSize(dirPath: string): number {
  let size = 0
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue
      const full = path.join(dirPath, entry.name)
      if (entry.isDirectory()) size += getDirSize(full)
      else {
        try {
          size += fs.statSync(full).size
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
  return size
}

function getExtension(filename: string): string {
  if (filename.toLowerCase() === 'dockerfile') return '.dockerfile'
  const parts = filename.split('.')
  if (parts.length < 2) return ''
  if (filename.includes('.min.')) return '.min.' + parts[parts.length - 1]
  return '.' + parts[parts.length - 1].toLowerCase()
}
