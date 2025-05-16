"use client"

import React from "react"
import Link from "next/link"

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="flex h-16 items-center justify-between px-2 sm:px-4">
          <div className="flex gap-2 md:gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Markhor</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  )
} 