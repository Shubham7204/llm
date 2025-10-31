"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react"

interface PDFViewerProps {
  pdfUrl: string
  fileName?: string
}

export function PDFViewer({ pdfUrl, fileName = "document.pdf" }: PDFViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [zoom, setZoom] = useState(100)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const handleDownload = () => {
    window.open(pdfUrl, '_blank')
  }

  return (
    <Card className={`border border-border bg-background overflow-hidden transition-all ${
      isExpanded ? 'fixed inset-4 z-50' : 'h-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">PDF Document</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 px-2 py-1 bg-background rounded-lg border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground min-w-12 text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Download Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </Button>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="h-full bg-muted/20 overflow-auto">
        <iframe
          src={`${pdfUrl}#zoom=${zoom}`}
          className="w-full h-full min-h-[600px]"
          title={fileName}
          style={{
            border: 'none',
            height: isExpanded ? 'calc(100vh - 120px)' : '600px'
          }}
        />
      </div>
    </Card>
  )
}
