"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Mic2, Sparkles, Loader2 } from "lucide-react"
import { CaseList } from "@/components/dashboard/case-list"
import { CreateCaseModal } from "@/components/dashboard/create-case-modal"
import * as api from "@/lib/api"

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [cases, setCases] = useState<Array<{ id: string; name: string; fileName: string; createdAt: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const projects = await api.getProjects()
      
      setCases(
        projects.map((p) => ({
          id: p.project_id,
          name: p.name,
          fileName: p.pdf_filename || "No PDF uploaded",
          createdAt: new Date(p.created_at).toLocaleDateString(),
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
      console.error("Failed to load projects:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCase = async (name: string, description: string) => {
    try {
      const result = await api.createProject(name, description)
      await loadProjects() // Reload to get updated list
      setShowCreateModal(false)
    } catch (err) {
      console.error("Failed to create project:", err)
      alert(err instanceof Error ? err.message : "Failed to create project")
    }
  }

  const handleDeleteCase = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return
    
    try {
      await api.deleteProject(id)
      setCases(cases.filter((c) => c.id !== id))
    } catch (err) {
      console.error("Failed to delete project:", err)
      alert(err instanceof Error ? err.message : "Failed to delete project")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Mic2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Podcast AI
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section - Show when projects exist */}
        {!loading && !error && cases.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Projects</h1>
              <p className="text-muted-foreground">
                Manage your PDF projects and podcasts
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground gap-2 h-11 px-6"
            >
              <Plus className="w-5 h-5" /> Create New Project
            </Button>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-24">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 mb-6">
              <Sparkles className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">Error loading projects</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">{error}</p>
            <Button onClick={loadProjects} variant="outline">
              Try Again
            </Button>
          </div>
        ) : cases.length > 0 ? (
          <CaseList cases={cases} onDeleteCase={handleDeleteCase} />
        ) : (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">No projects yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Create your first project to upload a PDF and start generating podcasts or asking questions
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground gap-2 h-11 px-6"
            >
              <Plus className="w-4 h-4" /> Create First Project
            </Button>
          </div>
        )}
      </main>

      {/* Create Case Modal */}
      <CreateCaseModal open={showCreateModal} onOpenChange={setShowCreateModal} onCreateCase={handleCreateCase} />
    </div>
  )
}
