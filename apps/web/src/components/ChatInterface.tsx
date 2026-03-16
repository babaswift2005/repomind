'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, FileCode2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage, SourceFile } from '@/types'

interface ChatInterfaceProps {
  repoId: string
  repoName: string
}

const SUGGESTED_QUESTIONS = [
  'How is this project structured?',
  'What are the main entry points?',
  'How does authentication work?',
  'What testing framework is used?',
  'How do I add a new feature?',
  'What are the key dependencies?',
]

export function ChatInterface({ repoId, repoName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi! I've analyzed **${repoName}** and I'm ready to answer your questions. Ask me anything about the codebase!`,
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMessage: ChatMessage = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    const assistantMessage: ChatMessage = { role: 'assistant', content: '', sources: [] }
    setMessages((prev) => [...prev, assistantMessage])

    abortRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId,
          message: text.trim(),
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error(`Chat failed: ${response.status}`)

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'sources') {
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...updated[updated.length - 1], sources: event.sources }
                return updated
              })
            } else if (event.type === 'chunk') {
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + event.content,
                }
                return updated
              })
            } else if (event.type === 'done' || event.type === 'error') {
              break
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'Sorry, I encountered an error. Please try again.',
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3 flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Chat with {repoName}</span>
        <Badge variant="info" className="text-xs ml-auto">
          Semantic Search
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isStreaming}
                className="text-xs border border-border/60 rounded-full px-2.5 py-1 hover:border-primary/60 hover:text-primary transition-colors text-muted-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border/60 p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the codebase... (Enter to send, Shift+Enter for newline)"
          disabled={isStreaming}
          rows={2}
          className="resize-none text-sm bg-transparent"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isStreaming}
          size="icon"
          className="shrink-0 self-end"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium mt-0.5 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border/60'
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      <div className={`flex-1 space-y-1 max-w-[85%] ${isUser ? 'items-end' : ''}`}>
        <div
          className={`rounded-xl px-4 py-2.5 text-sm ${
            isUser
              ? 'bg-primary text-primary-foreground ml-auto rounded-tr-none'
              : 'bg-muted/60 border border-border/40 rounded-tl-none'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || '▋'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="pl-1">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileCode2 className="h-3 w-3" />
              {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
              {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showSources && (
              <div className="mt-1.5 space-y-1">
                {message.sources.map((src, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded border border-border/40 bg-muted/30 px-2.5 py-1.5 text-xs"
                  >
                    <FileCode2 className="h-3 w-3 text-primary shrink-0" />
                    <span className="font-mono text-foreground/80 truncate">{src.path}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground">{src.relevance}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
