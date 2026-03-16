import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'RepoMind — AI that explains any GitHub repository',
  description:
    'Paste a GitHub URL and get an AI-powered explanation, file summaries, dependency graph, and interactive chat — all running locally with Ollama.',
  keywords: ['github', 'ai', 'code analysis', 'ollama', 'developer tool', 'open source'],
  openGraph: {
    title: 'RepoMind',
    description: 'AI that explains any GitHub repository. Powered by local models.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
