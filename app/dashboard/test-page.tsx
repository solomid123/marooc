// Simple test page to debug dashboard access
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    // Simple check to see if we can load this page
    setIsLoading(false)
    setMessage("Test page loaded successfully!")
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Test Page</h1>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>{message}</p>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <p>This is a simple test page to check if we can access the dashboard route.</p>
        
        <div className="flex space-x-4">
          <Button asChild>
            <Link href="/dashboard">Try Main Dashboard</Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 