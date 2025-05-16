"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Clock, Code, FileText, Mic, Settings, Upload } from "lucide-react"
import { InterviewAssistant } from "@/components/interview-assistant"
import { UpcomingInterviews } from "@/components/upcoming-interviews"
import { InterviewHistory } from "@/components/interview-history"
import { Button } from "@/components/ui/button"
import { InterviewConnectDialog } from "@/components/interview-connect-dialog"
import Link from "next/link"
import { MOCK_UPCOMING_INTERVIEWS } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { ResumeUpload } from "@/components/resume-upload"

interface DashboardClientProps {
  user: {
    firstName: string
    credits: number
    planName: string
  }
}

interface DashboardStats {
  credits: number
  planName: string
  interviewsCompleted: number
  lastWeekInterviews: number
  technicalQuestions: number
  upcomingInterviews: number
  nextInterview: string
}

interface ResumeInfo {
  skills: string[]
  experience: string[]
  education: string[]
  summary: string
  name: string
  email: string
  phone: string
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch dashboard stats from API
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/dashboard/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        
        const data = await response.json()
        setDashboardStats(data)
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError('Failed to load dashboard statistics')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardStats()
  }, [])

  const handleStartInterview = () => {
    if (resumeInfo) {
      setConnectDialogOpen(true)
    } else {
      setResumeDialogOpen(true)
    }
  }

  const handleConnectInterview = (stream: MediaStream | null) => {
    setConnectDialogOpen(false)
    
    if (stream) {
      // Store stream ID in sessionStorage
      sessionStorage.setItem('interviewScreenStreamId', stream.id)
      console.log("Stream saved to session storage, redirecting to interview page...");
      
      // Check if we have the data-sharing attribute set
      const isSharingActive = document.documentElement.getAttribute('data-sharing') === 'active';
      
      // Add a class to the body to indicate we're transitioning
      document.body.classList.add('redirecting-to-interview');
      
      // Make sure we're intentionally navigating to the interview page
      if (!isSharingActive) {
        document.documentElement.setAttribute('data-sharing', 'active');
      }
      
      // Add a small delay to ensure browser has time to process the screen sharing
      // before attempting navigation
      setTimeout(() => {
        // Check if we're still on the dashboard page before navigating
        if (window.location.pathname.includes('/dashboard')) {
          console.log("Navigating to interview page with stream:", stream.id);
          router.push("/interview");
        } else {
          console.log("Already navigated away from dashboard");
        }
      }, 500)
    } else {
      console.log("No stream provided, staying on dashboard");
    }
  }

  const handleResumeAnalyzed = (info: ResumeInfo) => {
    setResumeInfo(info)
    setResumeDialogOpen(false)
    setConnectDialogOpen(true)
  }

  const handleUploadResumeClick = () => {
    router.push("/dashboard/resume")
  }

  useEffect(() => {
    // Check if the browser is currently sharing a screen/tab
    const checkScreenSharing = () => {
      const isSharing = sessionStorage.getItem('interviewScreenStreamId');
      
      if (isSharing) {
        // Show a banner for easier navigation
        const bannerElement = document.createElement('div');
        bannerElement.id = 'screen-sharing-banner';
        bannerElement.style.cssText = 'position: fixed; top: 60px; left: 0; right: 0; background-color: #ef4444; color: white; text-align: center; padding: 10px; z-index: 9999; display: flex; justify-content: center; align-items: center;';
        
        bannerElement.innerHTML = `
          <div style="margin-right: 10px;">Screen sharing active - You should be in the interview view</div>
          <button id="goto-interview-btn" style="background-color: white; color: #ef4444; border: none; border-radius: 4px; padding: 4px 12px; cursor: pointer;">Continue to Interview</button>
        `;
        
        document.body.appendChild(bannerElement);
        
        // Add click event to the button
        document.getElementById('goto-interview-btn')?.addEventListener('click', () => {
          router.push('/interview');
        });
      }
    };
    
    checkScreenSharing();
    
    // Cleanup
    return () => {
      const banner = document.getElementById('screen-sharing-banner');
      if (banner) {
        banner.remove();
      }
    };
  }, [router]);

  // Use either fetched stats or fallback to user prop data
  const displayCredits = dashboardStats?.credits ?? user.credits;
  const displayPlanName = dashboardStats?.planName ?? user.planName;
  const displayInterviewsCompleted = dashboardStats?.interviewsCompleted ?? 0;
  const displayLastWeekInterviews = dashboardStats?.lastWeekInterviews ?? 0;
  const displayTechnicalQuestions = dashboardStats?.technicalQuestions ?? 0;
  const displayUpcomingInterviews = dashboardStats?.upcomingInterviews ?? 0;
  const displayNextInterview = dashboardStats?.nextInterview ?? "No upcoming interviews";

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {user.firstName}</h1>
          <div className="flex items-center gap-2">
            {typeof window !== 'undefined' && document && document.documentElement.getAttribute('data-sharing') && (
              <Button onClick={() => router.push('/interview')} size="sm" className="h-8 bg-red-500 hover:bg-red-600">
                Continue to Interview
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8" onClick={handleUploadResumeClick}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Resume
            </Button>
            <Button size="sm" className="h-8" onClick={handleStartInterview}>
              Start Interview
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayCredits.toFixed(1)} hours</div>
              <p className="text-xs text-muted-foreground">From your {displayPlanName} plan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews Completed</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayInterviewsCompleted}</div>
              <p className="text-xs text-muted-foreground">+{displayLastWeekInterviews} from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Technical Questions</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayTechnicalQuestions}</div>
              <p className="text-xs text-muted-foreground">Answered successfully</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayUpcomingInterviews}</div>
              <p className="text-xs text-muted-foreground">Next: {displayNextInterview}</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="assistant">
          <TabsList>
            <TabsTrigger value="assistant">Interview Assistant</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Interviews</TabsTrigger>
            <TabsTrigger value="history">Interview History</TabsTrigger>
          </TabsList>
          <TabsContent value="assistant" className="space-y-4">
            <InterviewAssistant resumeInfo={resumeInfo} />
          </TabsContent>
          <TabsContent value="upcoming" className="space-y-4">
            <UpcomingInterviews />
          </TabsContent>
          <TabsContent value="history" className="space-y-4">
            <InterviewHistory />
          </TabsContent>
        </Tabs>
      </div>

      <InterviewConnectDialog
        isOpen={connectDialogOpen}
        onClose={() => setConnectDialogOpen(false)}
        onConnect={handleConnectInterview}
      />

      <ResumeUpload 
        isOpen={resumeDialogOpen} 
        onClose={() => setResumeDialogOpen(false)}
        onResumeAnalyzed={handleResumeAnalyzed}
      />
    </>
  )
} 