"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Settings, Home, ArrowLeft, Mic, CalendarDays, Clock, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { MOCK_USER } from "@/lib/mock-data"

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const userInitials = `${MOCK_USER.firstName.charAt(0)}${MOCK_USER.lastName.charAt(0)}`.toUpperCase()
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="flex h-16 items-center justify-between px-2 sm:px-4">
          <div className="flex gap-2 md:gap-4">
            <a href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Markhor</span>
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <div className="mr-2 text-sm">
              <span className="text-muted-foreground">Credits:</span>{" "}
              <span className="font-medium">{MOCK_USER.credits.toFixed(1)} hours</span>
            </div>
            <nav className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                <Home className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {userInitials}
                </span>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <div className="flex flex-1 w-full">
        <aside className="hidden w-[200px] border-r flex-col md:flex lg:w-[220px] py-4 px-2">
          <nav className="grid items-start gap-1">
            <a href="/interview" className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary">
              <Mic className="h-4 w-4" />
              Interview Assistant
            </a>
            <a
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </a>
            <a
              href="/dashboard/upcoming"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <CalendarDays className="h-4 w-4" />
              Upcoming Interviews
            </a>
            <a
              href="/dashboard/history"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <Clock className="h-4 w-4" />
              Interview History
            </a>
            <a
              href="/dashboard/resume"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-4 w-4" />
              Resume Manager
            </a>
            <a
              href="/dashboard/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </a>
          </nav>
        </aside>
        <main className="flex-1 py-2 px-2">
          {children}
        </main>
      </div>
    </div>
  )
} 