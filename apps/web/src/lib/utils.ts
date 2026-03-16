import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function extractRepoInfo(url: string): { owner: string; name: string } | null {
  const patterns = [
    /github\.com\/([^/]+)\/([^/\s.]+)/,
    /github\.com\/([^/]+)\/([^/\s]+)\.git/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return { owner: match[1], name: match[2].replace(/\.git$/, '') }
  }
  return null
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    Python: '#3572a5',
    Rust: '#dea584',
    Go: '#00add8',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    Ruby: '#701516',
    PHP: '#4f5d95',
    Swift: '#fa7343',
    Kotlin: '#a97bff',
    Scala: '#c22d40',
    Vue: '#4fc08d',
    Svelte: '#ff3e00',
    CSS: '#563d7c',
    HTML: '#e34c26',
    Shell: '#89e051',
    Markdown: '#083fa1',
    JSON: '#292929',
    YAML: '#cb171e',
    Dockerfile: '#384d54',
  }
  return colors[language] || '#8b8b8b'
}

export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript',
    js: 'JavaScript',
    jsx: 'JavaScript',
    mjs: 'JavaScript',
    cjs: 'JavaScript',
    py: 'Python',
    rs: 'Rust',
    go: 'Go',
    java: 'Java',
    cpp: 'C++',
    cc: 'C++',
    cxx: 'C++',
    c: 'C',
    h: 'C',
    hpp: 'C++',
    rb: 'Ruby',
    php: 'PHP',
    swift: 'Swift',
    kt: 'Kotlin',
    kts: 'Kotlin',
    scala: 'Scala',
    vue: 'Vue',
    svelte: 'Svelte',
    css: 'CSS',
    scss: 'CSS',
    less: 'CSS',
    html: 'HTML',
    htm: 'HTML',
    sh: 'Shell',
    bash: 'Shell',
    zsh: 'Shell',
    md: 'Markdown',
    mdx: 'Markdown',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    toml: 'TOML',
    dockerfile: 'Dockerfile',
  }
  if (filePath.toLowerCase().includes('dockerfile')) return 'Dockerfile'
  return languageMap[ext || ''] || 'Text'
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}
