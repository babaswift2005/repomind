import chalk from 'chalk'
import ora from 'ora'

interface AnalyzeOptions {
  model: string
  server: string
}

export async function analyzeCommand(url: string, options: AnalyzeOptions) {
  console.log()
  console.log(chalk.bold('🧠 RepoMind') + chalk.dim(' — AI Repository Analyzer'))
  console.log()

  // Validate URL
  if (!url.includes('github.com')) {
    console.error(chalk.red('✗ Please provide a valid GitHub repository URL'))
    process.exit(1)
  }

  // Check server
  const spinner = ora('Checking RepoMind server...').start()
  try {
    const check = await fetch(`${options.server}/api/ollama-check`)
    const status = await check.json() as { running: boolean; models: Array<{ name: string }> }

    if (!status.running) {
      spinner.fail(chalk.red('Ollama is not running'))
      console.log()
      console.log(chalk.dim('Start Ollama and pull the required models:'))
      console.log(chalk.cyan('  ollama serve'))
      console.log(chalk.cyan('  ollama pull llama3.2'))
      console.log(chalk.cyan('  ollama pull nomic-embed-text'))
      process.exit(1)
    }

    spinner.succeed(chalk.green(`Ollama running (${status.models.length} models)`))
  } catch {
    spinner.fail(chalk.red(`Cannot connect to RepoMind server at ${options.server}`))
    console.log()
    console.log(chalk.dim('Start the server first:'))
    console.log(chalk.cyan('  cd apps/web && pnpm dev'))
    process.exit(1)
  }

  console.log()
  console.log(chalk.bold('Repository:'), chalk.cyan(url))
  console.log()

  const analysisSpinner = ora('Starting analysis...').start()

  try {
    const response = await fetch(`${options.server}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      const data = await response.json() as { error?: string }
      throw new Error(data.error ?? `Server error ${response.status}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let repoId: string | null = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const event = JSON.parse(line.slice(6)) as {
            type: string
            step?: string
            progress?: number
            repoId?: string
            message?: string
          }

          if (event.type === 'progress') {
            const pct = String(event.progress ?? 0).padStart(3)
            analysisSpinner.text = `${chalk.dim(`[${pct}%]`)} ${event.step ?? '...'}`
          } else if (event.type === 'complete') {
            repoId = event.repoId ?? null
            analysisSpinner.succeed(chalk.green('Analysis complete!'))
          } else if (event.type === 'error') {
            throw new Error(event.message ?? 'Analysis failed')
          }
        } catch {
          // skip
        }
      }
    }

    if (repoId) {
      console.log()
      console.log(chalk.bold('✓ Repository analyzed successfully'))
      console.log()
      console.log(chalk.dim('View in browser:'))
      console.log(chalk.cyan(`  ${options.server}/analyze/${repoId}`))
      console.log()
      console.log(chalk.dim('Start chatting:'))
      console.log(chalk.cyan(`  repomind chat ${url}`))
    }
  } catch (err) {
    analysisSpinner.fail(chalk.red('Analysis failed'))
    console.error(chalk.dim(err instanceof Error ? err.message : String(err)))
    process.exit(1)
  }
}
