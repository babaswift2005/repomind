# RepoMind 🧠

> AI that explains any GitHub repository. Powered by local models via Ollama — no API keys, no cost, fully private.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequests.com)

**Author · Owner:** [Baba Swift](https://github.com/babaswift2005) ([@babaswift2005](https://github.com/babaswift2005))

---

## ✨ Features

- **🔍 Repo Analyzer** — Clone any public GitHub repo and extract full structure
- **📝 AI Summaries** — Per-file and module-level explanations using local LLMs
- **💬 AI Chat** — Ask questions about the codebase in natural language
- **🕸️ Dependency Graph** — Visualize import relationships between files
- **📚 Docs Generator** — Auto-generate README and onboarding documentation
- **⌨️ CLI Tool** — `repomind analyze <url>` from your terminal

---

## 🚀 Quick Start

### How RepoMind runs

- **RepoMind is designed to run locally on your machine.**
- It uses **Ollama** to run AI models on your own hardware, so there is **no hosted online version** of the analyzer.
- You can deploy the UI anywhere if you want, but **actual analysis and AI features require Ollama running locally**.

### Prerequisites

1. **Node.js 18+** (npm is enough; pnpm optional)
   ```bash
   npm install -g pnpm
   ```

2. **Ollama** — the desktop app, not a Python package  
   - Download and install from **[ollama.ai](https://ollama.ai)** (pick Windows).  
   - Do **not** use `pip install ollama` — that’s a different (Python) client. RepoMind needs the **Ollama application** so models run locally.  
   - After install, **close and reopen** your terminal (or restart) so `ollama` is on PATH.  
   - Then pull the models:
   ```bash
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```
   If `ollama` is still not recognized, use the full path (e.g. `"%LOCALAPPDATA%\Programs\Ollama\ollama.exe" pull llama3.2`) or add Ollama’s install folder to your system PATH.

3. **Git** — required for cloning repositories

### Installation

```bash
# Clone the repository
git clone https://github.com/babaswift2005/repomind
cd repomind

# Install dependencies (from repo root)
cd apps\web
npm install

# Start the web app
npm run dev
```

On macOS/Linux use `cd apps/web` instead of `cd apps\web`.

Open [http://localhost:3000](http://localhost:3000) — paste any GitHub URL and hit **Analyze**.

---

## 🖥️ Web Interface

The web dashboard provides a full IDE-like experience:

| Tab | Description |
|-----|-------------|
| **Overview** | AI-generated project explanation and key stats |
| **Files** | Browsable file tree with per-file AI summaries |
| **Architecture** | Interactive dependency graph |
| **Chat** | Ask anything about the codebase |
| **Docs** | Generate README and onboarding documentation |

---

## ⌨️ CLI Tool

```bash
# Install CLI globally
cd apps/cli && pnpm install && pnpm link --global

# Analyze a repository
repomind analyze https://github.com/vercel/next.js

# Chat about a repository
repomind chat https://github.com/facebook/react

# Generate documentation
repomind docs https://github.com/tailwindlabs/tailwindcss
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes, Node.js |
| **AI** | Ollama (llama3.2, nomic-embed-text) |
| **Storage** | File-based JSON (no database setup needed) |
| **Git** | simple-git |

---

## 📁 Project Structure

```
repomind/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router pages & API routes
│   │   │   ├── components/ # React components
│   │   │   └── lib/      # Core logic (analyzer, AI, storage)
│   └── cli/              # CLI tool
├── data/                 # Analyzed repos stored here (auto-created)
└── README.md
```

---

## ⚙️ Configuration

Create a `.env.local` in `apps/web/`:

```env
# Custom Ollama URL (default: http://localhost:11434)
OLLAMA_URL=http://localhost:11434

# Model to use for chat/summaries (default: llama3.2)
OLLAMA_MODEL=llama3.2

# Model for embeddings (default: nomic-embed-text)
OLLAMA_EMBED_MODEL=nomic-embed-text

# Max files to analyze per repo (default: 80)
MAX_ANALYZE_FILES=80
```

---

## 🔧 Supported Models

Any Ollama model works! Recommended:

| Model | Best For | Speed |
|-------|----------|-------|
| `llama3.2` | General explanations | Fast |
| `codellama` | Code-specific questions | Medium |
| `deepseek-coder` | Deep code analysis | Medium |
| `mistral` | Lightweight & fast | Very Fast |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Ollama](https://ollama.ai) — Local LLM inference
- [shadcn/ui](https://ui.shadcn.com) — UI components
- [simple-git](https://github.com/steveukx/git-js) — Git operations in Node.js
- [Next.js](https://nextjs.org) — React framework

---

---

<p align="center">
  <strong>RepoMind</strong> by <a href="https://github.com/babaswift2005">Baba Swift</a> · Made with ❤️ for the open-source community
</p>
