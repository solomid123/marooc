"use client"

import { useState, useEffect } from "react"
import { ResumeUpload } from "@/components/resume-upload"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, FileText, UploadCloud } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ResumeData {
  name: string
  email: string
  phone: string
  summary: string
  skills: string[]
  experience: string[]
  education: string[]
  updated_at?: string
  fileName?: string
}

interface ResumeManagementPageProps {
  resumeData: ResumeData | null
}

export function ResumeManagementPage({ resumeData }: ResumeManagementPageProps) {
  const [resumeInfo, setResumeInfo] = useState<ResumeData | null>(resumeData)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadHistory, setUploadHistory] = useState<{date: Date, filename: string}[]>([])
  
  // Initialize upload history if resume data exists
  useEffect(() => {
    if (resumeData) {
      const lastUpdate = resumeData.updated_at 
        ? new Date(resumeData.updated_at) 
        : new Date()
      
      setUploadHistory([
        { date: lastUpdate, filename: "resume_latest.pdf" },
        { date: new Date(lastUpdate.getTime() - 7 * 24 * 60 * 60 * 1000), filename: "resume_v1.pdf" }
      ])
    }
  }, [resumeData])

  const handleResumeAnalyzed = async (info: ResumeData) => {
    setResumeInfo(info);
    setUploadDialogOpen(false);
    
    try {
      // Call API to save the resume data
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save resume');
      }
      
      // Update upload history
      setUploadHistory(prev => [
        { date: new Date(), filename: info.fileName || "resume_latest.pdf" },
        ...prev
      ]);
    } catch (error) {
      console.error("Error saving resume:", error);
      // You could add error handling UI here
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Resume Manager</h1>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <UploadCloud className="mr-2 h-4 w-4" />
          {resumeInfo ? "Upload New Resume" : "Upload Resume"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {resumeInfo ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resume Analysis</CardTitle>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Analyzed
                  </Badge>
                </div>
                <CardDescription>Your resume has been analyzed and key information extracted</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 pt-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src="/placeholder-user.jpg" alt={resumeInfo.name} />
                        <AvatarFallback>{resumeInfo.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-bold">{resumeInfo.name}</h2>
                        <p className="text-muted-foreground">{resumeInfo.email} • {resumeInfo.phone}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Professional Summary</h3>
                      <p className="text-sm text-muted-foreground">{resumeInfo.summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2">Experience</h3>
                        <ul className="space-y-1">
                          {resumeInfo.experience.slice(0, 2).map((exp, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• {exp}</li>
                          ))}
                          {resumeInfo.experience.length > 2 && (
                            <li className="text-sm text-primary">+ {resumeInfo.experience.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Education</h3>
                        <ul className="space-y-1">
                          {resumeInfo.education.map((edu, i) => (
                            <li key={i} className="text-sm text-muted-foreground">• {edu}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="skills" className="pt-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">Technical Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {resumeInfo.skills.map((skill, i) => (
                          <Badge key={i} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="experience" className="pt-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">Work Experience</h3>
                      <div className="space-y-4">
                        {resumeInfo.experience.map((exp, i) => (
                          <div key={i} className="border-l-2 pl-4 py-1 border-muted">
                            <p className="text-sm">{exp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="education" className="pt-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">Education</h3>
                      <div className="space-y-4">
                        {resumeInfo.education.map((edu, i) => (
                          <div key={i} className="border-l-2 pl-4 py-1 border-muted">
                            <p className="text-sm">{edu}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  Last updated: {formatDate(uploadHistory[0]?.date || new Date())}
                </p>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Resume Uploaded</CardTitle>
                <CardDescription>Upload your resume to get started with personalized interview assistance</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Upload Your Resume</h3>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
                  Our AI will analyze your resume and provide personalized interview tips and assistance
                </p>
                <Button className="mt-6" onClick={() => setUploadDialogOpen(true)}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>Previous resumes you've uploaded</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadHistory.length > 0 ? (
                <div className="space-y-3">
                  {uploadHistory.map((upload, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{upload.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(upload.date)}</p>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">No upload history</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your first resume to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Interview Tips</CardTitle>
              <CardDescription>Based on your resume</CardDescription>
            </CardHeader>
            <CardContent>
              {resumeInfo ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">Highlight Your Technical Skills</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Emphasize your experience with {resumeInfo.skills.slice(0, 3).join(', ')}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">Discuss Your Experience</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Be ready to talk about your role at {resumeInfo.experience[0]?.split(' at ')[1]?.split(' ')[0] || 'your previous company'}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">Prepare For Common Questions</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Practice answering questions about your background and project work
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">No tips available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your resume to get personalized tips
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ResumeUpload 
        isOpen={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        onResumeAnalyzed={handleResumeAnalyzed}
      />
    </div>
  )
} 