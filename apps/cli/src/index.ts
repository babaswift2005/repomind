#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import { analyzeCommand } from './commands/analyze.js'
import { chatCommand } from './commands/chat.js'
import { docsCommand } from './commands/docs.js'

const program = new Command()

program
  .name('repomind')
  .description(
    chalk.bold('RepoMind') + ' — AI that explains any GitHub repository\n' +
    chalk.dim('Powered by Ollama (local AI, no API keys required)')
  )
  .version('1.0.0')

program
  .command('analyze <url>')
  .description('Clone and analyze a GitHub repository')
  .option('-m, --model <model>', 'Ollama model to use', 'llama3.2')
  .option('-s, --server <url>', 'RepoMind server URL', 'http://localhost:3000')
  .action(analyzeCommand)

program
  .command('chat <url>')
  .description('Start an interactive chat session about a repository')
  .option('-m, --model <model>', 'Ollama model to use', 'llama3.2')
  .option('-s, --server <url>', 'RepoMind server URL', 'http://localhost:3000')
  .action(chatCommand)

program
  .command('docs <url>')
  .description('Generate documentation for a repository')
  .option('-t, --type <type>', 'Doc type: readme | onboarding | architecture', 'readme')
  .option('-o, --output <file>', 'Output file path')
  .option('-s, --server <url>', 'RepoMind server URL', 'http://localhost:3000')
  .action(docsCommand)

program.parse()
