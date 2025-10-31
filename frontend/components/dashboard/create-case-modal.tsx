"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Sparkles } from "lucide-react"

interface CreateCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCase: (name: string, description: string) => void
}

export function CreateCaseModal({ open, onOpenChange, onCreateCase }: CreateCaseModalProps) {
  const [caseName, setCaseName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (caseName.trim()) {
      onCreateCase(caseName, description)
      setCaseName("")
      setDescription("")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border border-border shadow-2xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">New Project</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="hover:bg-muted">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Project Name</label>
              <input
                type="text"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                placeholder="e.g., Q4 Financial Report"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your project..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10">
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10 font-semibold"
                disabled={!caseName.trim()}
              >
                Create Project
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
