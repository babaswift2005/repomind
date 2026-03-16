import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs'

interface DocsOptions {
  type: string
  output?: string
  server: string
}

export async function docsCommand(url: string, options: DocsOptions) {
  const docType = options.type as 'readme' | 'onboarding' | 'architecture'
  const validTypes = ['readme', 'onboarding', 'architecture']

  if (!validTypes.includes(docType)) {
    console.error(chalk.red(`Invalid type "${docType}". Use: readme | onboarding | architecture`))
    process.exit(1)
  }

  console.log()
  console.log(chalk.bold('🧠 RepoMind') + chalk.dim(' — Documentation Generator'))
  console.log()

  // Find analyzed repo
  const lookupSpinner = ora('Looking up repository...').start()
  let repoId: string | null = null

  try {
    const repos = await fetch(`${options.server}/api/repos`).then((r) => r.json()) as Array<{
      id: string
      name: string
      url: string
      status: string
    }>

    const existing = repos.find((r) => r.url === url.replace(/\.git$/, '').trim() && r.status === 'ready')

    if (existing) {
      repoId = existing.id
      lookupSpinner.succeed(chalk.green(`Found: ${existing.name}`))
    } else {
      lookupSpinner.fail(chalk.yellow('Repository not analyzed yet'))
      console.log(chalk.dim(`\nRun first: repomind analyze ${url}`))
      process.exit(1)
    }
  } catch {
    lookupSpinner.fail(chalk.red('Failed to connect to RepoMind server'))
    process.exit(1)
  }

  const docTypeLabels: Record<string, string> = {
    readme: 'README.md',
    onboarding: 'Onboarding Guide',
    architecture: 'Architecture Docs',
  }

  const generateSpinner = ora(`Generating ${docTypeLabels[docType]}...`).start()

  try {
    const res = await fetch(`${options.server}/api/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoId, type: docType }),
    })

    if (!res.ok) throw new Error(`Server error: ${res.status}`)

    const data = await res.json() as { content?: string; error?: string }

    if (!data.content) throw new Error(data.error ?? 'No content returned')

    generateSpinner.succeed(chalk.green(`${docTypeLabels[docType]} generated!`))
    console.log()

    const defaultFilenames: Record<string, string> = {
      readme: 'README.md',
      onboarding: 'ONBOARDING.md',
      architecture: 'ARCHITECTURE.md',
    }

    const outputFile = options.output ?? defaultFilenames[docType]

    fs.writeFileSync(outputFile, data.content, 'utf-8')
    console.log(chalk.bold('✓ Saved to:'), chalk.cyan(outputFile))
    console.log()

    // Preview first few lines
    const lines = data.content.split('\n').slice(0, 8)
    console.log(chalk.dim('Preview:'))
    console.log(chalk.dim('─'.repeat(50)))
    for (const line of lines) {
      console.log(chalk.dim(line))
    }
    if (data.content.split('\n').length > 8) {
      console.log(chalk.dim(`... and ${data.content.split('\n').length - 8} more lines`))
    }
  } catch (err) {
    generateSpinner.fail(chalk.red('Generation failed'))
    console.error(chalk.dim(err instanceof Error ? err.message : String(err)))
    process.exit(1)
  }
}
