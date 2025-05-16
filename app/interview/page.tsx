"use client"

import { useState, useEffect } from "react"
import { RealTimeInterview } from "@/components/real-time-interview"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { ClockIcon, TimerIcon, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Define resume info interface
interface ResumeInfo {
  skills: string[]
  experience: string[]
  education: string[]
  summary: string
  name?: string
  email?: string
  phone?: string
}

export default function InterviewPage() {
  const [interviewStarted, setInterviewStarted] = useState(true)
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null)
  const router = useRouter()

  // Check if we already have resume info in session storage
  useEffect(() => {
    // Try to get resume info from session storage
    const resumeInfoStr = sessionStorage.getItem('resumeInfo')
    if (resumeInfoStr) {
      try {
        const parsedResumeInfo = JSON.parse(resumeInfoStr)
        setResumeInfo(parsedResumeInfo)
        console.log("Loaded resume info from session storage:", parsedResumeInfo)
      } catch (error) {
        console.error("Error parsing resume info from session storage:", error)
      }
    }
  }, [])

  return (
    <div className="h-full w-full">
      <RealTimeInterview resumeInfo={resumeInfo} />
    </div>
  )
} 