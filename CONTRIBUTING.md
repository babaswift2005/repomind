# Contributing to RepoMind

Thank you for your interest in contributing! RepoMind is an open-source project and contributions are very welcome.

## Getting Started

1. Fork the repository: [github.com/babaswift2005/repomind](https://github.com/babaswift2005/repomind)
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/repomind` (replace YOUR_USERNAME with your GitHub username)
3. Install dependencies: `cd repomind && npm install` (in `apps/web`)
4. Copy env: `cp apps/web/.env.example apps/web/.env.local`
5. Start Ollama and pull models: `ollama pull llama3.2 && ollama pull nomic-embed-text`
6. Start the dev server: `cd apps/web && npm run dev`

## Project Structure

```
repomind/
├── apps/
│   ├── web/          # Next.js app (frontend + API)
│   │   └── src/
│   │       ├── app/  # Routes and API endpoints
│   │       ├── components/ # React components
│   │       └── lib/  # Core logic
│   └── cli/          # CLI tool
```

## Areas to Contribute

- **New language support** in `src/lib/graph.ts` (dependency parsing)
- **UI improvements** in `src/components/`
- **New AI prompts** in `src/lib/analyzer.ts` and `src/lib/docs.ts`
- **Performance** — parallel file processing, caching
- **Tests** — unit tests for lib functions
- **Bug fixes** — check GitHub Issues

## Code Style

- TypeScript strict mode throughout
- Functional React components with hooks
- Tailwind for styling
- No `any` types
- Run `npx tsc --noEmit` before submitting

## Pull Requests

1. Create a branch: `git checkout -b feat/your-feature`
2. Make changes and test locally
3. Commit with conventional commits: `feat:`, `fix:`, `chore:`, etc.
4. Push and open a PR with a clear description

## Reporting Issues

Use GitHub Issues. Please include:
- Your OS and Node.js version
- Ollama version and models installed
- Steps to reproduce
- Expected vs actual behavior
