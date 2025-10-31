"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2, FileText, User, Bot } from "lucide-react"
import * as api from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  references?: Array<{ page: number; text: string; relevance?: number }>
}

interface ChatInterfaceProps {
  caseId: string
}

export function ChatInterface({ caseId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I've analyzed your research paper. Ask me about the methodology, key findings, related work, or any specific sections. I'll provide detailed answers with page citations.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
    }
  }, [input])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const query = input
    setInput("")
    setIsLoading(true)

    try {
      const response = await api.chatWithPDF(caseId, query)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        references: response.references.map(ref => ({
          page: ref.page,
          text: ref.text_preview,
          relevance: ref.relevance
        })),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}. Please make sure the PDF is uploaded and processed.`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-48">
        <div className="w-full">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`group w-full border-b border-border/40 last:border-b-0 ${
                message.role === "assistant" ? "bg-background" : "bg-muted/30"
              }`}
            >
              <div className="flex gap-4 p-6 md:p-8 max-w-3xl mx-auto">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-sm flex items-center justify-center ${
                      message.role === "assistant"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3 overflow-hidden">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-foreground leading-7 whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  {/* References */}
                  {message.references && message.references.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Sources
                        </span>
                      </div>
                      <div className="space-y-2">
                        {message.references.map((ref, idx) => (
                          <div
                            key={idx}
                            className="text-sm p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                                {ref.page}
                              </span>
                              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                                {ref.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading State */}
          {isLoading && (
            <div className="w-full bg-background border-b border-border/40">
              <div className="flex gap-4 p-6 md:p-8 max-w-3xl mx-auto">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-accent text-accent-foreground">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed to viewport bottom (centered) */}
      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-6 w-full px-4 z-50">
        <div className="max-w-3xl mx-auto px-2 py-0 w-full">
          <form onSubmit={handleSendMessage} className="relative">
            <div className="relative flex items-end gap-2 bg-background border border-border rounded-xl shadow-lg focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your PDF..."
                rows={1}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-32 overflow-y-auto"
                style={{ minHeight: '24px' }}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="m-2 flex-shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
