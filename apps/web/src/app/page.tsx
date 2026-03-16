import { AnalyzeForm } from '@/components/AnalyzeForm'
import { OllamaStatus } from '@/components/OllamaStatus'
import { RepoHistory } from '@/components/RepoHistory'
import { Brain, MessageSquare, GitBranch, FileSearch, BookOpen, Terminal } from 'lucide-react'

const FEATURES = [
  {
    icon: FileSearch,
    title: 'Smart Analysis',
    description: 'Clone any public repo and get AI-powered per-file summaries and a full project explanation.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat',
    description: 'Ask questions in natural language. Semantic search finds the most relevant code context.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: GitBranch,
    title: 'Dependency Graph',
    description: 'Visualize import relationships between files with an interactive force-directed graph.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: BookOpen,
    title: 'Docs Generator',
    description: 'Generate professional README, onboarding guides, and architecture docs in one click.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Terminal,
    title: 'CLI Tool',
    description: 'Run `repomind analyze <url>` from your terminal for a quick command-line experience.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
  {
    icon: Brain,
    title: '100% Local',
    description: 'Powered by Ollama — no API keys, no cost, fully private. Your code never leaves your machine.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
  },
]

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative grid-bg border-b border-border/40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-transparent to-cyan-950/20 pointer-events-none" />

        <div className="container relative max-w-4xl mx-auto px-4 py-20 sm:py-28">
          <div className="flex flex-col items-center text-center space-y-6 animate-slide-up">
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary">
              <Brain className="h-3.5 w-3.5" />
              Powered by Ollama — no API keys required
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-foreground">Understand any</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                GitHub repository
              </span>
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Paste a GitHub URL. RepoMind clones it, analyzes the codebase with local AI models,
              and gives you explanations, summaries, a dependency graph, and an interactive chat interface.
            </p>

            <div className="w-full max-w-2xl mt-4">
              <AnalyzeForm />
            </div>

            <div className="mt-4">
              <OllamaStatus />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-3">Everything you need to understand a codebase</h2>
          <p className="text-muted-foreground">All running locally on your machine.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border/60 bg-card p-5 hover:border-border transition-colors"
            >
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${f.bg} mb-3`}>
                <f.icon className={`h-4.5 w-4.5 ${f.color}`} />
              </div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/40 bg-muted/20">
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground">Three steps from URL to understanding.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Paste URL', desc: 'Enter any public GitHub repository URL. RepoMind does a shallow clone to keep it fast.' },
              { step: '02', title: 'AI Analysis', desc: 'Ollama runs locally to summarize files, generate embeddings, and explain the architecture.' },
              { step: '03', title: 'Explore', desc: 'Chat with the codebase, browse file summaries, visualize dependencies, and generate docs.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-primary font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent analyses */}
      <section className="container max-w-4xl mx-auto px-4 py-12">
        <RepoHistory />
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-auto">
        <div className="container max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span>RepoMind — Open Source</span>
          </div>
          <p>MIT License · Built for developers, by developers</p>
        </div>
      </footer>
    </div>
  )
}
