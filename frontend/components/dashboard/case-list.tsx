"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Trash2, Calendar } from "lucide-react"
import { useState } from "react"

interface Case {
  id: string
  name: string
  fileName: string
  createdAt: string
}

interface CaseListProps {
  cases: Case[]
  onDeleteCase: (id: string) => void
}

export function CaseList({ cases, onDeleteCase }: CaseListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cases.map((caseItem) => (
        <div
          key={caseItem.id}
          className="relative group"
          onMouseEnter={() => setHoveredId(caseItem.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <Link href={`/dashboard/${caseItem.id}`}>
            <Card className="p-6 border border-border hover:border-accent/50 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col bg-gradient-to-br from-background to-background/50">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all shadow-sm">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition line-clamp-2">
                {caseItem.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-1">{caseItem.fileName}</p>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {caseItem.createdAt}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition" />
              </div>
            </Card>
          </Link>

          {hoveredId === caseItem.id && (
            <Button
              variant="destructive"
              size="icon"
              onClick={(e) => {
                e.preventDefault()
                onDeleteCase(caseItem.id)
              }}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:shadow-xl"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
