"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, Zap, Loader2 } from "lucide-react"
import * as api from "@/lib/api"

interface PDFUploadProps {
  projectId: string
  onUploadComplete: (data: { filename: string; total_pages: number; word_count: number }) => void
}

export function PDFUpload({ projectId, onUploadComplete }: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      alert("Please upload a PDF file")
      return
    }

    setIsUploading(true)
    setUploadedFile(file.name)
    setError(null)
    setUploadProgress("Uploading PDF...")

    try {
      // Upload PDF
      setUploadProgress("Processing PDF...")
      const result = await api.uploadPDF(projectId, file)
      
      setUploadProgress("Building search index...")
      
      // Simulate a brief delay to show completion
      setTimeout(() => {
        setIsUploading(false)
        onUploadComplete({
          filename: result.filename,
          total_pages: result.total_pages,
          word_count: result.word_count
        })
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload PDF")
      setIsUploading(false)
      setUploadedFile(null)
      console.error("Upload error:", err)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card
        className={`border-2 transition-all duration-300 p-12 ${
          isDragging ? "border-accent bg-accent/5 shadow-lg" : "border-dashed border-border hover:border-accent/50"
        }`}
      >
        <div className="text-center space-y-8">
          {!uploadedFile ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-3">Upload Your PDF</h2>
                <p className="text-muted-foreground text-lg">Drag and drop your document here or click to browse</p>
                {error && <p className="text-destructive text-sm mt-2">{error}</p>}
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
                  isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer block">
                  <div className="space-y-3">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="text-base text-muted-foreground font-medium">Click to select or drag PDF here</p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>Maximum file size: 50MB</span>
                <span>•</span>
                <span>PDF format only</span>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10">
                {isUploading ? (
                  <Loader2 className="w-10 h-10 text-accent animate-spin" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-accent" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {isUploading ? "Processing PDF..." : "Ready to Go!"}
                </h3>
                <p className="text-muted-foreground">
                  {isUploading ? uploadProgress : `${uploadedFile} is ready for chat and podcast generation`}
                </p>
              </div>
              {!isUploading && (
                <div className="flex items-center justify-center gap-2 text-accent font-medium">
                  <Zap className="w-4 h-4" />
                  <span>Your PDF is ready!</span>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
