"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Check, AlertCircle, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface ResumeInfo {
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
  name: string;
  email: string;
  phone: string;
  fileName?: string;
  fileType?: string;
}

interface ResumeUploadProps {
  onResumeAnalyzed: (resumeInfo: ResumeInfo) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ResumeUpload({ onResumeAnalyzed, isOpen = true, onClose }: ResumeUploadProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [resumeText, setResumeText] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFile(file)
      
      // Read file content if it's a PDF or text file
      if (file.type === "application/pdf" || file.type === "text/plain") {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const text = e.target?.result as string
          setResumeText(text)
        }
        reader.readAsText(file)
      } else {
        setError("Please upload a PDF or text file.")
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setUploadedFile(file)
      
      // Read file content
      if (file.type === "application/pdf" || file.type === "text/plain") {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const text = e.target?.result as string
          setResumeText(text)
        }
        reader.readAsText(file)
      } else {
        setError("Please upload a PDF or text file.")
      }
    }
  }

  const analyzeResume = async () => {
    setIsAnalyzing(true)
    setError(null)
    try {
      // In a real implementation, this would call the Gemini API
      // For now, we'll simulate the analysis with mock data
      
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock response data
      const mockResumeInfo: ResumeInfo = {
        skills: ["JavaScript", "React", "TypeScript", "Node.js", "API Integration", "UI/UX Design"],
        experience: [
          "Senior Frontend Developer at Tech Corp (2020-Present)",
          "Web Developer at Startup Inc. (2018-2020)",
          "Junior Developer at Code Agency (2016-2018)"
        ],
        education: ["Bachelor of Science in Computer Science, University State (2016)"],
        summary: "Experienced frontend developer with 5+ years of experience building responsive web applications using modern JavaScript frameworks.",
        name: "Alex Johnson",
        email: "alex.johnson@example.com",
        phone: "(555) 123-4567",
        fileName: uploadedFile?.name,
        fileType: uploadedFile?.type
      }
      
      setResumeInfo(mockResumeInfo)
      onResumeAnalyzed(mockResumeInfo)
      
    } catch (err) {
      setError("Failed to analyze resume. Please try again.")
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="w-full border-0 shadow-none">
          <CardHeader>
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>
              Upload your CV or resume to get personalized interview assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="manual">Enter Manually</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">Upload your resume</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag and drop or click to browse
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf,.txt,.doc,.docx" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    ref={fileInputRef}
                  />
                </div>
                
                {uploadedFile && (
                  <div className="flex items-center p-3 bg-muted rounded-md">
                    <FileText className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john.doe@example.com" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="resume-text">Resume Content</Label>
                    <Textarea 
                      id="resume-text" 
                      placeholder="Paste your resume content here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={10}
                      className="resize-none"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {resumeInfo && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-500" />
                <AlertTitle>Resume Analyzed Successfully</AlertTitle>
                <AlertDescription>Your resume has been analyzed and key information has been extracted.</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={analyzeResume} 
              disabled={isAnalyzing || (!uploadedFile && !resumeText)}
              className={onClose ? "" : "w-full"}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  {resumeInfo ? 'Re-analyze Resume' : 'Analyze Resume'}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 