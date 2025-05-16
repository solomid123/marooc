"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Play, Code, FileText, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InterviewConnectDialog } from "@/components/interview-connect-dialog"
import { useRouter } from "next/navigation"
import { AssemblyAIRealTimeTranscription, setupAudioProcessing } from "@/lib/api-services"

interface ResumeInfo {
  skills: string[]
  experience: string[]
  education: string[]
  summary: string
  name: string
  email: string
  phone: string
}

interface InterviewAssistantProps {
  resumeInfo?: ResumeInfo | null
}

export function InterviewAssistant({ resumeInfo = null }: InterviewAssistantProps) {
  const [copied, setCopied] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)
  const [interviewType, setInterviewType] = useState("general")
  const [platform, setPlatform] = useState("zoom")
  const [language, setLanguage] = useState("english")
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(
      "In my previous role at XYZ Corp, I led a team that was tasked with migrating our legacy system to a modern cloud architecture. The main challenges included maintaining data integrity, ensuring zero downtime, and training team members on the new technology. I approached this by creating a phased migration plan, implementing comprehensive testing protocols, and organizing regular knowledge-sharing sessions. Despite initial setbacks with data synchronization, we successfully completed the migration two weeks ahead of schedule, resulting in a 40% improvement in system performance.",
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartInterview = () => {
    setConnectDialogOpen(true)
  }

  const handleConnectSession = (stream: MediaStream | null) => {
    setConnectDialogOpen(false)
    setScreenStream(stream)
    setIsListening(true)
    
    // Navigate to interview page with the stream
    if (stream) {
      console.log("Stream received in interview assistant, preparing for navigation");
      
      // Store stream ID in sessionStorage to retrieve it on the interview page
      sessionStorage.setItem('interviewScreenStreamId', stream.id)
      
      // Check if we have the data-sharing attribute set
      const isSharingActive = document.documentElement.getAttribute('data-sharing') === 'active';
      
      // Make sure we're intentionally navigating to the interview page
      if (!isSharingActive) {
        document.documentElement.setAttribute('data-sharing', 'active');
      }
      
      // Store resume info in sessionStorage if available
      if (resumeInfo) {
        try {
          sessionStorage.setItem('resumeInfo', JSON.stringify(resumeInfo))
          console.log("Stored resume info in session storage:", resumeInfo)
        } catch (error) {
          console.error("Error storing resume info in session storage:", error)
        }
      }
      
      // Add a small delay to ensure browser has time to process the screen sharing
      // before attempting navigation
      setTimeout(() => {
        console.log("Navigating to interview page");
        router.push('/interview')
      }, 500)
    } else {
      console.log("No stream provided, staying on current page");
    }
  }

  // Cleanup function for streams
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [screenStream])

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Interview Setup</CardTitle>
            <CardDescription>Configure your interview assistant before starting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Video Conference Platform
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="google-meet">Google Meet</SelectItem>
                  <SelectItem value="ms-teams">Microsoft Teams</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Interview Type
              </label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical/Coding</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                  <SelectItem value="chinese">Chinese</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4">
              <Button className="w-full" onClick={isListening ? () => setIsListening(false) : handleStartInterview}>
                {isListening ? (
                  <>
                    <Mic className="mr-2 h-4 w-4 animate-pulse text-red-500" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Interview Assistant</CardTitle>
              {isListening && (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                  <span className="mr-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  Live
                </Badge>
              )}
            </div>
            <CardDescription>
              {isListening ? "Listening to your interview..." : "Start your interview to get real-time assistance"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4">
                <div className="mt-4 space-y-4">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">Detected Question:</p>
                    <p className="text-sm">
                      Can you tell me about a challenging project you worked on and how you overcame obstacles?
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary">Suggested Answer:</p>
                      <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm">
                      In my previous role at XYZ Corp, I led a team that was tasked with migrating our legacy system to a
                      modern cloud architecture. The main challenges included maintaining data integrity, ensuring zero
                      downtime, and training team members on the new technology. I approached this by creating a phased
                      migration plan, implementing comprehensive testing protocols, and organizing regular
                      knowledge-sharing sessions. Despite initial setbacks with data synchronization, we successfully
                      completed the migration two weeks ahead of schedule, resulting in a 40% improvement in system
                      performance.
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="technical" className="space-y-4">
                <div className="mt-4 space-y-4">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">Detected Coding Question:</p>
                    <p className="text-sm">
                      How would you implement a function to find the longest substring without repeating characters?
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary">Suggested Solution:</p>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-xs overflow-auto p-2 bg-black/80 text-white rounded-md mt-2">
                      {`function lengthOfLongestSubstring(s) {
  let maxLength = 0;
  let start = 0;
  const charMap = new Map();
  
  for (let end = 0; end < s.length; end++) {
    const currentChar = s[end];
    
    if (charMap.has(currentChar) && charMap.get(currentChar) >= start) {
      start = charMap.get(currentChar) + 1;
    }
    
    charMap.set(currentChar, end);
    maxLength = Math.max(maxLength, end - start + 1);
  }
  
  return maxLength;
}`}
                    </pre>
                    <p className="text-xs mt-2">
                      This solution uses a sliding window approach with a hash map to track character positions. It has
                      O(n) time complexity where n is the length of the string.
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="transcript" className="space-y-4">
                <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">2:05 PM</p>
                    <p className="text-sm font-medium">Interviewer:</p>
                    <p className="text-sm">Hello! Thanks for joining us today. How are you doing?</p>
                  </div>
                  <div className="bg-background border p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">2:05 PM</p>
                    <p className="text-sm font-medium">You:</p>
                    <p className="text-sm">Hi, I'm doing well, thank you! I'm excited to be here today.</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">2:06 PM</p>
                    <p className="text-sm font-medium">Interviewer:</p>
                    <p className="text-sm">
                      Great! Let's start by having you tell me a bit about yourself and your background.
                    </p>
                  </div>
                  <div className="bg-background border p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">2:06 PM</p>
                    <p className="text-sm font-medium">You:</p>
                    <p className="text-sm">
                      Of course! I'm a software engineer with 5 years of experience specializing in full-stack
                      development...
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-xs text-muted-foreground">2:08 PM</p>
                    <p className="text-sm font-medium">Interviewer:</p>
                    <p className="text-sm">
                      Can you tell me about a challenging project you worked on and how you overcame obstacles?
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" disabled={!isListening}>
              <FileText className="mr-2 h-4 w-4" />
              Save Transcript
            </Button>
            <Button disabled={!isListening} onClick={() => {
              if (screenStream) {
                router.push('/interview')
              } else {
                handleStartInterview()
              }
            }}>
              <Code className="mr-2 h-4 w-4" />
              {screenStream ? 'View Interview' : 'Capture Screen'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <InterviewConnectDialog
        isOpen={connectDialogOpen}
        onClose={() => setConnectDialogOpen(false)}
        onConnect={handleConnectSession}
        resumeInfo={resumeInfo}
      />
    </>
  )
}
