import chalk from 'chalk'
import ora from 'ora'
import readline from 'readline'

interface ChatOptions {
  model: string
  server: string
}

export async function chatCommand(url: string, options: ChatOptions) {
  console.log()
  console.log(chalk.bold('🧠 RepoMind') + chalk.dim(' — Interactive Chat'))
  console.log()

  // Find or analyze repo
  const spinner = ora('Looking up repository...').start()

  let repoId: string | null = null
  let repoName: string = url

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
      repoName = existing.name
      spinner.succeed(chalk.green(`Found analyzed repo: ${repoName}`))
    } else {
      spinner.info(chalk.yellow('Repository not yet analyzed. Running analysis first...'))
      console.log()

      const analyzeRes = await fetch(`${options.server}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!analyzeRes.ok) throw new Error('Analysis request failed')

      const analyzeSpinner = ora('Analyzing...').start()
      const reader = analyzeRes.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6)) as { type: string; step?: string; progress?: number; repoId?: string }
            if (ev.type === 'progress') {
              analyzeSpinner.text = `[${ev.progress ?? 0}%] ${ev.step}`
            } else if (ev.type === 'complete') {
              repoId = ev.repoId ?? null
              analyzeSpinner.succeed(chalk.green('Analysis complete!'))
            }
          } catch { /* skip */ }
        }
      }
    }
  } catch (err) {
    spinner.fail(chalk.red('Failed to connect to RepoMind server'))
    console.log(chalk.dim(`Make sure the server is running at ${options.server}`))
    process.exit(1)
  }

  if (!repoId) {
    console.error(chalk.red('Could not get repository ID'))
    process.exit(1)
  }

  console.log()
  console.log(chalk.bold(`Chatting with: ${repoName}`))
  console.log(chalk.dim('Type your question and press Enter. Type "exit" to quit.'))
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const history: Array<{ role: string; content: string }> = []

  const askQuestion = () => {
    rl.question(chalk.cyan('You: '), async (input) => {
      const message = input.trim()

      if (!message) return askQuestion()
      if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
        console.log(chalk.dim('\nGoodbye!'))
        rl.close()
        return
      }

      history.push({ role: 'user', content: message })

      process.stdout.write(chalk.bold('\nAssistant: '))

      try {
        const res = await fetch(`${options.server}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoId, message, history }),
        })

        if (!res.ok) throw new Error('Chat request failed')

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue
            try {
              const ev = JSON.parse(line.slice(6)) as { type: string; content?: string; sources?: unknown[] }
              if (ev.type === 'chunk' && ev.content) {
                process.stdout.write(ev.content)
                fullResponse += ev.content
              }
            } catch { /* skip */ }
          }
        }

        history.push({ role: 'assistant', content: fullResponse })
        console.log('\n')
      } catch (err) {
        console.log(chalk.red('\n[Error: ' + (err instanceof Error ? err.message : 'unknown') + ']'))
      }

      askQuestion()
    })
  }

  askQuestion()
}
