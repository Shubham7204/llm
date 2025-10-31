"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic2, FileText, MessageSquare, Zap, ArrowRight, Play, Sparkles } from "lucide-react"

export default function Home() {
  const [isHovering, setIsHovering] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Mic2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Podcast AI
            </span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition">
              How it Works
            </a>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-sm font-medium">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-40">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-8">
            <div className="inline-block">
              <span className="text-sm font-semibold text-accent px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                ✨ AI-Powered PDF Intelligence
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight text-balance">
              Transform PDFs into <span className="text-accent">Engaging Podcasts</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Upload any PDF, chat with your documents, and generate natural-sounding podcasts in seconds. Powered by
              advanced AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-12 px-8">
                  Start Creating <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 bg-transparent">
                <Play className="w-4 h-4" /> Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to create professional podcasts from documents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Smart PDF Processing",
                description: "Upload any PDF and our AI instantly extracts and understands the content with precision.",
              },
              {
                icon: MessageSquare,
                title: "Interactive Chat",
                description: "Ask questions about your PDF and get instant, contextual answers with source citations.",
              },
              {
                icon: Mic2,
                title: "AI Podcast Generation",
                description: "Generate natural, conversational podcasts with multiple voices and realistic dialogue.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Process documents and generate podcasts in seconds, not hours.",
              },
              {
                icon: Play,
                title: "High-Quality Audio",
                description: "Professional-grade audio output with natural-sounding voices and perfect timing.",
              },
              {
                icon: Sparkles,
                title: "Organize Cases",
                description: "Create named projects to organize and manage all your PDF conversions in one place.",
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className="p-8 border border-border hover:border-accent/50 transition-all duration-300 cursor-pointer group"
                onMouseEnter={() => setIsHovering(`feature-${idx}`)}
                onMouseLeave={() => setIsHovering(null)}
              >
                <div className="flex justify-center mb-6">
                  <div
                    className={`p-3 rounded-lg transition-all ${isHovering === `feature-${idx}` ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"}`}
                  >
                    <feature.icon className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 text-center">{feature.title}</h3>
                <p className="text-muted-foreground text-center">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Three simple steps to create your first podcast</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your PDF",
                description:
                  "Create a new case and upload any PDF document. Our AI instantly processes and indexes the content.",
              },
              {
                step: "02",
                title: "Chat & Explore",
                description:
                  "Ask questions about your document and get instant answers. Explore topics before generating your podcast.",
              },
              {
                step: "03",
                title: "Generate Podcast",
                description:
                  "Click generate and let AI create a natural, engaging podcast conversation about your document.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-bold text-accent/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-accent to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your PDFs?</h2>
          <p className="text-lg opacity-90">Join thousands of users creating professional podcasts from documents</p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary gap-2">
              Start Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                  <Mic2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Podcast AI</span>
              </div>
              <p className="text-sm text-muted-foreground">Transform PDFs into engaging podcasts with AI</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2025 Podcast AI. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition">
                Twitter
              </a>
              <a href="#" className="hover:text-foreground transition">
                LinkedIn
              </a>
              <a href="#" className="hover:text-foreground transition">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
