"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Settings, Home, Mic, CalendarDays, Clock, FileText } from "lucide-react"
import { MOCK_USER } from "@/lib/mock-data"
import Link from "next/link"
import { NavLink } from "@/components/ui/nav-link"
import { useEffect, useState } from "react"
import { User } from "@/lib/get-current-user"

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In development mode, always use mock user
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    // In development/preview, always use the mock user
    if (isPreview) {
      console.log("Dashboard layout: Development mode detected, using mock user")
      setUser(MOCK_USER)
    } else {
      // In production, we would implement proper auth here
      // For now, just use mock user for all environments
      setUser(MOCK_USER)
    }
  }, [])

  // Show loading state until user is loaded
  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="flex h-16 items-center justify-between px-2 sm:px-4">
          <div className="flex gap-2 md:gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Markhor</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <div className="mr-2 text-sm">
              <span className="text-muted-foreground">Credits:</span>{" "}
              <span className="font-medium">{user.credits.toFixed(1)} hours</span>
            </div>
            <nav className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {userInitials}
                  </span>
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <div className="flex flex-1 w-full">
        <aside className="hidden w-[200px] border-r flex-col md:flex lg:w-[220px] py-4 px-2">
          <nav className="grid items-start gap-1">
            <NavLink href="/dashboard" exact>
              <Mic className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink href="/interview">
              <Home className="h-4 w-4" />
              Interview
            </NavLink>
            <NavLink href="/dashboard/upcoming">
              <CalendarDays className="h-4 w-4" />
              Upcoming Interviews
            </NavLink>
            <NavLink href="/dashboard/history">
              <Clock className="h-4 w-4" />
              Interview History
            </NavLink>
            <NavLink href="/dashboard/resume">
              <FileText className="h-4 w-4" />
              Resume Manager
            </NavLink>
            <NavLink href="/dashboard/settings">
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1 py-2 px-2">
          {children}
        </main>
      </div>
    </div>
  )
}
