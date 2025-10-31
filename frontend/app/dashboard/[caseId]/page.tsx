"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic2, MessageSquare, ArrowLeft, Loader2 } from "lucide-react"
import { ChatInterface } from "@/components/case/chat-interface"
import { PodcastGenerator } from "@/components/case/podcast-generator"
import { PDFUpload } from "@/components/case/pdf-upload"
import * as api from "@/lib/api"

export default function CasePage() {
  const params = useParams()
  const caseId = params.caseId as string
  const [pdfUploaded, setPdfUploaded] = useState(false)
  const [caseName, setCaseName] = useState("My PDF Project")
  const [loading, setLoading] = useState(true)

  // Load project details on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const project = await api.getProject(caseId)
        setCaseName(project.name)
        // Check if PDF is already uploaded
        if (project.pdf_filename) {
          setPdfUploaded(true)
        }
      } catch (err) {
        console.error("Failed to load project:", err)
      } finally {
        setLoading(false)
      }
    }
    loadProject()
  }, [caseId])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="hover:bg-accent/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{caseName}</h1>
              <p className="text-sm text-muted-foreground">Project ID: {caseId}</p>
            </div>
          </div>
          {/* settings button removed per request */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !pdfUploaded ? (
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <PDFUpload 
              projectId={caseId} 
              onUploadComplete={(data) => {
                console.log('PDF uploaded:', data)
                setPdfUploaded(true)
              }} 
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="chat" className="flex flex-col h-full">
              <div className="flex justify-center pt-6 pb-0">
                <TabsList className="grid w-full max-w-xs grid-cols-2 bg-muted/50 p-1 rounded-lg border border-border/50">
                  <TabsTrigger
                    value="chat"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-accent"
                  >
                    <MessageSquare className="w-4 h-4" /> Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="podcast"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-accent"
                  >
                    <Mic2 className="w-4 h-4" /> Podcast
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="flex-1 flex flex-col mt-0 overflow-hidden h-full m-0 data-[state=active]:flex">
                <ChatInterface caseId={caseId} />
              </TabsContent>

              <TabsContent value="podcast" className="flex-1 flex flex-col mt-4 overflow-y-auto px-4 sm:px-6 lg:px-8">
                <PodcastGenerator caseId={caseId} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}
