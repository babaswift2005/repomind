import { generate } from './ollama'
import type { FileSummary, RepoMeta } from '@/types'

export async function generateReadme(meta: RepoMeta, files: FileSummary[]): Promise<string> {
  const topFiles = files.slice(0, 15)
  const fileSummaries = topFiles
    .map((f) => `- **${f.path}** (${f.language}): ${f.summary}`)
    .join('\n')

  const languages = meta.stats
    ? Object.entries(meta.stats.languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang, count]) => `${lang} (${count} files)`)
        .join(', ')
    : 'Various'

  const prompt = `Generate a professional, comprehensive README.md for a GitHub repository.

Repository: ${meta.owner}/${meta.name}
URL: ${meta.url}
Languages: ${languages}

Project Overview:
${meta.explanation ?? 'A software project'}

Key Files:
${fileSummaries}

Generate a complete README.md with:
1. Project title and brief description
2. Badges (build, license, etc. - use placeholder URLs)
3. Features list
4. Installation instructions (infer from file types)
5. Usage examples (infer from code)
6. Project structure
7. Contributing section
8. License section

Format as proper Markdown. Make it look professional and welcoming to contributors.`

  return generate(prompt, { temperature: 0.5 })
}

export async function generateOnboardingDocs(
  meta: RepoMeta,
  files: FileSummary[]
): Promise<string> {
  const entryPoints = files
    .filter((f) =>
      ['index', 'main', 'app', 'server', 'cli'].some((n) =>
        f.path.toLowerCase().includes(n)
      )
    )
    .slice(0, 5)

  const entryText = entryPoints
    .map((f) => `- ${f.path}: ${f.summary}`)
    .join('\n')

  const prompt = `Create a developer onboarding guide for: ${meta.owner}/${meta.name}

Overview:
${meta.explanation ?? 'A software project'}

Entry Points:
${entryText || 'Not detected'}

Write a "Getting Started for New Contributors" guide covering:
1. Project overview and goals
2. Architecture walkthrough
3. Setting up local development
4. Key concepts to understand first
5. Where to find things (where is X?)
6. Common development workflows
7. Testing approach
8. How to make your first contribution

Format as Markdown. Be practical and developer-friendly.`

  return generate(prompt, { temperature: 0.5 })
}

export async function generateArchitectureDocs(
  meta: RepoMeta,
  files: FileSummary[]
): Promise<string> {
  const fileSummaries = files
    .slice(0, 20)
    .map((f) => `- ${f.path} (${f.language}): ${f.summary}`)
    .join('\n')

  const prompt = `Create an architecture document for: ${meta.owner}/${meta.name}

Project Overview:
${meta.explanation ?? 'A software project'}

Files and Components:
${fileSummaries}

Write a technical architecture document covering:
1. System overview
2. Component breakdown
3. Data flow
4. Key design patterns used
5. External dependencies
6. Scalability considerations

Format as Markdown with diagrams described in text (Mermaid format where appropriate).`

  return generate(prompt, { temperature: 0.4 })
}
