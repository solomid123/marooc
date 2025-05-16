"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertCircle, Video, Mic, Camera, Check, ChevronRight, Monitor, CheckCircle } from "lucide-react"
import Image from "next/image"
import { VideoTutorialDialog } from "./video-tutorial-dialog"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const jobFormSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  language: z.string().default("English"),
  jobDescription: z.string().optional(),
})

type JobFormValues = z.infer<typeof jobFormSchema>

interface InterviewConnectDialogProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (screenStream: MediaStream | null) => void
  resumeInfo?: {
    skills: string[]
    experience: string[]
    education: string[]
    summary: string
    name: string
    email: string
    phone: string
  } | null
}

export function InterviewConnectDialog({
  isOpen,
  onClose,
  onConnect,
  resumeInfo = null,
}: InterviewConnectDialogProps) {
  const [videoTutorialOpen, setVideoTutorialOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<'job-info' | 'device-access' | 'screen-select'>('job-info')
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [screenSelectError, setScreenSelectError] = useState<string | null>(null)

  const platforms = [
    { id: "zoom", name: "Zoom", icon: "/placeholder-logo.svg" },
    { id: "meet", name: "Google Meet", icon: "/placeholder-logo.svg" },
    { id: "teams", name: "Microsoft Teams", icon: "/placeholder-logo.svg" },
    { id: "webex", name: "Webex", icon: "/placeholder-logo.svg" },
    { id: "skype", name: "Skype", icon: "/placeholder-logo.svg" },
    { id: "phone", name: "Phone", icon: "/placeholder-logo.svg" },
  ]

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      company: "",
      position: "",
      language: "English",
      jobDescription: "",
    },
  })

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setMicPermission('granted')
      return true
    } catch (err) {
      setMicPermission('denied')
      return false
    }
  }

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
      return true
    } catch (err) {
      setCameraPermission('denied')
      return false
    }
  }

  const requestScreenShare = async () => {
    setScreenSelectError(null);
    try {
      // We'll use a flag to track if sharing was successful
      let sharingSuccessful = false;
      
      // Create a listener to detect when screen sharing is successfully established
      const screenSharingListener = () => {
        console.log("Screen sharing detected!");
        sharingSuccessful = true;
      };
      
      // Listen for screen sharing events
      if (typeof window !== 'undefined') {
        // This is a workaround as there's no standard event for screen sharing success
        // We'll set a flag on document for other components to check
        document.documentElement.setAttribute('data-sharing', 'pending');
        window.addEventListener('focus', screenSharingListener);
      }
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
        },
        audio: true
      });
      
      // Clean up the event listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', screenSharingListener);
        document.documentElement.setAttribute('data-sharing', 'active');
      }
      
      console.log("Screen sharing successful, stream acquired:", stream.id);
      setScreenStream(stream);
      
      // Add a handler for when sharing stops
      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen sharing ended by user");
        if (typeof window !== 'undefined') {
          document.documentElement.removeAttribute('data-sharing');
        }
      };
      
      return true;
    } catch (err) {
      console.error('Error selecting screen:', err);
      
      // Clean up any attributes we set
      if (typeof window !== 'undefined') {
        document.documentElement.removeAttribute('data-sharing');
      }
      
      setScreenSelectError(
        err instanceof Error 
          ? err.message 
          : 'Failed to select a screen. Please try again.'
      );
      return false;
    }
  }

  const handleNextStep = async () => {
    if (currentStep === 'job-info') {
      // Validate job info form before proceeding
      const valid = await form.trigger()
      if (valid) {
        setCurrentStep('device-access')
      }
    } else if (currentStep === 'device-access') {
      // Request device permissions if not already granted
      let micGranted = micPermission === 'granted'
      let cameraGranted = cameraPermission === 'granted'
      
      if (micPermission !== 'granted') {
        micGranted = await requestMicPermission()
      }
      
      if (cameraPermission !== 'granted') {
        cameraGranted = await requestCameraPermission()
      }
      
      if (micGranted && cameraGranted) {
        setCurrentStep('screen-select')
      }
    } else if (currentStep === 'screen-select') {
      if (screenStream) {
        // If we already have a screen stream, proceed
        console.log("Using existing screen stream");
        onConnect(screenStream)
      } else {
        // Try to get screen share first
        console.log("Requesting screen share");
        const success = await requestScreenShare()
        if (success) {
          console.log("Screen share successful, connecting to interview");
          // Slight delay to ensure stream is properly set up
          setTimeout(() => {
            onConnect(screenStream)
          }, 100);
        } else {
          console.log("Screen share failed or was cancelled");
        }
      }
    }
  }

  const renderJobInfoStep = () => (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="Company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Position</FormLabel>
              <FormControl>
                <Input placeholder="Job title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Chinese">Chinese</SelectItem>
                  <SelectItem value="Japanese">Japanese</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="jobDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Paste job description to improve AI responses" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {resumeInfo && (
          <div className="bg-primary/5 p-3 rounded-md">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              <p className="text-sm font-medium">Resume analyzed and ready</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your resume information will be used to tailor AI responses.
            </p>
          </div>
        )}
      </form>
    </Form>
  )

  const renderDeviceAccessStep = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-4 border rounded-md">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${micPermission === 'granted' ? 'bg-green-100' : 'bg-muted'}`}>
              <Mic className={`h-5 w-5 ${micPermission === 'granted' ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium text-sm">Microphone Access</p>
              <p className="text-xs text-muted-foreground">Required for real-time transcription</p>
            </div>
          </div>
          {micPermission === 'granted' ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <Button size="sm" onClick={requestMicPermission}>
              {micPermission === 'denied' ? 'Retry' : 'Allow'}
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-md">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${cameraPermission === 'granted' ? 'bg-green-100' : 'bg-muted'}`}>
              <Camera className={`h-5 w-5 ${cameraPermission === 'granted' ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium text-sm">Camera Access</p>
              <p className="text-xs text-muted-foreground">Optional for interview recording</p>
            </div>
          </div>
          {cameraPermission === 'granted' ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <Button size="sm" onClick={requestCameraPermission}>
              {cameraPermission === 'denied' ? 'Retry' : 'Allow'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">
              These permissions are required for the interview assistant to work properly.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your audio will be processed locally and through our secure transcription service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderScreenSelectStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select the browser tab or window where your interview is taking place.
      </p>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Make sure to select the "Also share tab audio" option when sharing the screen.
          </p>
        </div>
      </div>
      
      <div 
        className="p-6 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={requestScreenShare}
      >
        {screenStream ? (
          <div className="space-y-2">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Screen Selected</h3>
            <p className="text-sm text-muted-foreground">
              You can now connect to your interview
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Monitor className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">Select Meeting Window</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click here to choose which window to share
            </p>
          </div>
        )}
      </div>
      
      {screenSelectError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{screenSelectError}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Connect with:</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {platforms.map((platform) => (
            <div 
              key={platform.id}
              className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80"
            >
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <Image 
                  src={platform.icon} 
                  alt={platform.name} 
                  width={24} 
                  height={24} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border rounded-md p-4">
        <div className="flex gap-3">
          <div className="bg-muted h-16 w-24 rounded-md relative flex items-center justify-center">
            <Video className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              Instead of an interview tab, you can also share a mock interview
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              on YouTube and test it that way.
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm mt-1"
              onClick={() => setVideoTutorialOpen(true)}
            >
              Mock Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 'job-info':
        return renderJobInfoStep()
      case 'device-access':
        return renderDeviceAccessStep()
      case 'screen-select':
        return renderScreenSelectStep()
      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'job-info':
        return 'Job Information'
      case 'device-access':
        return 'Device Access'
      case 'screen-select':
        return 'Connect to Interview'
      default:
        return 'Connect'
    }
  }

  useEffect(() => {
    // Clean up media streams when component unmounts
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screenStream]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{getStepTitle()}</DialogTitle>
            <DialogDescription>
              {currentStep === 'job-info' && "Enter information about the job you're interviewing for"}
              {currentStep === 'device-access' && "We need access to your microphone for real-time transcription"}
              {currentStep === 'screen-select' && "Select the window where your interview is taking place"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {renderStepContent()}
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                if (currentStep === 'job-info') {
                  onClose()
                } else if (currentStep === 'device-access') {
                  setCurrentStep('job-info')
                } else if (currentStep === 'screen-select') {
                  setCurrentStep('device-access')
                }
              }}
            >
              {currentStep === 'job-info' ? 'Cancel' : 'Back'}
            </Button>
            <Button onClick={handleNextStep} className="gap-2">
              {currentStep === 'screen-select' ? (
                <>
                  <Video className="h-4 w-4" />
                  Start and Connect
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
          
          {currentStep === 'screen-select' && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Starting the session will use one of your interview credits.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <VideoTutorialDialog 
        isOpen={videoTutorialOpen}
        onClose={() => setVideoTutorialOpen(false)}
        title="Mock Interview Tutorial"
      />
    </>
  )
} 