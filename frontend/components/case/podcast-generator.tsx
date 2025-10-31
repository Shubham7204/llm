"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Play, Download, Volume2, Calendar, Clock, Tag } from "lucide-react"
import * as api from "@/lib/api"

interface PodcastGeneratorProps {
  caseId: string
}

interface PodcastItem {
  podcast_id: string
  created_at: string
  topic?: string
  duration: string
  script: string
  audio_filename: string
  segments_count: number
}

export function PodcastGenerator({ caseId }: PodcastGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [duration, setDuration] = useState<"short" | "medium" | "long">("medium")
  const [topic, setTopic] = useState("")
  const [allPodcasts, setAllPodcasts] = useState<PodcastItem[]>([])
  const [selectedPodcastIndex, setSelectedPodcastIndex] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load all existing podcasts on mount
  useEffect(() => {
    loadPodcasts()
  }, [caseId])

  const loadPodcasts = async () => {
    try {
      const project = await api.getProject(caseId)
      
      if (project.podcasts && project.podcasts.length > 0) {
        // Reverse to show newest first
        setAllPodcasts([...project.podcasts].reverse())
        setSelectedPodcastIndex(0) // Select the newest podcast
      }
    } catch (err) {
      console.error("Failed to load podcasts:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePodcast = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const result = await api.generatePodcast(caseId, topic || undefined, duration)
      
      // Reload all podcasts to include the new one
      await loadPodcasts()
      
      // Clear the form
      setTopic("")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate podcast')
      console.error('Podcast generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      'short': '3-5 min',
      'medium': '5-8 min',
      'long': '10-15 min'
    }
    return labels[duration] || duration
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 px-4 pb-8">
      {/* Generation Form */}
      <Card className="p-8 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Generate Podcast</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Podcast Duration</label>
            <div className="grid grid-cols-3 gap-3">
              {(["short", "medium", "long"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-4 py-3 rounded-lg border transition-all ${
                    duration === d
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  <div className="font-medium capitalize">{d}</div>
                  <div className="text-xs">
                    {d === "short" && "3-5 min"}
                    {d === "medium" && "5-8 min"}
                    {d === "long" && "10-15 min"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Focus Topic (Optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Key findings, Executive summary"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <Button
            onClick={handleGeneratePodcast}
            disabled={isGenerating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Podcast...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                {allPodcasts.length > 0 ? "Generate New Podcast" : "Generate Podcast"}
              </>
            )}
          </Button>
          
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
              {error}
            </div>
          )}
        </div>
      </Card>

      {/* Podcast History */}
      {allPodcasts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">
              Generated Podcasts ({allPodcasts.length})
            </h3>
          </div>

          {/* Podcast List */}
          <div className="grid gap-4">
            {allPodcasts.map((podcast, index) => {
              const isSelected = index === selectedPodcastIndex
              const audioUrl = api.getAudioUrl(podcast.audio_filename)

              return (
                <Card 
                  key={podcast.podcast_id} 
                  className={`p-6 border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-accent bg-accent/5 shadow-md' 
                      : 'border-border hover:border-accent/50'
                  }`}
                  onClick={() => setSelectedPodcastIndex(index)}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          <Volume2 className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-lg mb-2">
                            {podcast.topic || "General Overview"}
                          </h4>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(podcast.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span className="capitalize">{getDurationLabel(podcast.duration)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Tag className="w-4 h-4" />
                              <span>{podcast.segments_count} segments</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audio Player - Show when selected */}
                    {isSelected && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="bg-background/50 rounded-lg p-4">
                          <audio 
                            controls 
                            className="w-full" 
                            src={audioUrl}
                            key={podcast.podcast_id}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>

                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              const audio = document.querySelector(`audio[src="${audioUrl}"]`) as HTMLAudioElement
                              if (audio) audio.play()
                            }}
                          >
                            <Play className="w-4 h-4" /> Play
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 gap-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(audioUrl, '_blank')
                            }}
                          >
                            <Download className="w-4 h-4" /> Download
                          </Button>
                        </div>

                        {/* Script */}
                        <div className="pt-4 border-t border-border">
                          <h5 className="font-medium text-foreground mb-3">Podcast Script</h5>
                          <div className="bg-background rounded-lg p-4 text-sm text-muted-foreground max-h-96 overflow-y-auto whitespace-pre-wrap font-mono border border-border">
                            {podcast.script}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
