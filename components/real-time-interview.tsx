"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, MicOff, Copy, Check, Sparkles, FileText, X, AlertCircle, Loader2, Sparkle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AssemblyAIRealTimeTranscription, setupAudioProcessing, generateAnswerWithGemini } from "@/lib/api-services"
import { WebSpeechTranscription } from "@/lib/web-speech-transcription"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Added safety timeout for audio context closure
const AUDIO_CLEANUP_TIMEOUT = 1000;

interface TranscriptItem {
  id: string
  speaker: "interviewer" | "candidate"
  text: string
  timestamp: Date
}

interface AIResponse {
  id: string
  question: string
  answer: string
  timestamp: Date
  source?: 'auto' | 'manual'
  isMultipleChoice?: boolean
}

// Create a union type for transcription services
type TranscriptionService = AssemblyAIRealTimeTranscription | WebSpeechTranscription;

// Define ResumeInfo interface for type safety
interface ResumeInfo {
  skills: string[]
  experience: string[]
  education: string[]
  summary: string
  name?: string
  email?: string
  phone?: string
}

// Add props interface for RealTimeInterview
interface RealTimeInterviewProps {
  resumeInfo?: ResumeInfo | null
}

export function RealTimeInterview({ resumeInfo = null }: RealTimeInterviewProps) {
  const [isListening, setIsListening] = useState(true)
  const [transcript, setTranscript] = useState<TranscriptItem[]>([])
  const [aiResponses, setAIResponses] = useState<AIResponse[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<string>("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioProcessor, setAudioProcessor] = useState<any>(null)
  const [transcriptionService, setTranscriptionService] = useState<TranscriptionService | null>(null)
  const [lastDetectedSpeaker, setLastDetectedSpeaker] = useState<"interviewer" | "candidate" | null>(null)
  const [liveTranscript, setLiveTranscript] = useState<string>("")
  const [currentSpeaker, setCurrentSpeaker] = useState<"interviewer" | "candidate">("interviewer")
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [speechRecognitionError, setSpeechRecognitionError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState<string>("")
  const [userResume, setUserResume] = useState<string>("")
  
  const transcriptRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const transcriptionRef = useRef<{
    service: TranscriptionService | null;
    processor: { stop: () => void } | null;
  }>({ service: null, processor: null });
  
  const router = useRouter();
  
  // Safe cleanup function that ensures proper resource release
  const safeCleanupResources = () => {
    console.log("Safely cleaning up interview resources");
    
    // First stop the transcription service
    if (transcriptionRef.current.service) {
      try {
        console.log("Disconnecting transcription service");
        transcriptionRef.current.service.disconnect();
        transcriptionRef.current.service = null;
      } catch (err) {
        console.error("Error disconnecting transcription service:", err);
      }
    }
    
    // Then stop the audio processor with a delay to ensure audio context has time to close
    if (transcriptionRef.current.processor) {
      try {
        console.log("Stopping audio processor");
        setTimeout(() => {
          try {
            transcriptionRef.current.processor?.stop();
            transcriptionRef.current.processor = null;
          } catch (err) {
            console.error("Error stopping audio processor:", err);
          }
        }, AUDIO_CLEANUP_TIMEOUT);
      } catch (err) {
        console.error("Error stopping audio processor:", err);
      }
    }
    
    // Finally stop all tracks in the media stream
    if (screenStream) {
      try {
        console.log("Stopping screen stream tracks");
        screenStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (err) {
            console.error("Error stopping track:", err);
          }
        });
      } catch (err) {
        console.error("Error stopping screen stream:", err);
      }
    }
  };
  
  // Update setupStream to access microphone immediately
  useEffect(() => {
    const setupStream = async () => {
      try {
        setIsConnecting(true);
        console.log("Setting up interview stream...");
        
        try {
          // Request microphone access immediately for faster transcription
          console.log("Requesting microphone access...");
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true
          });
          
          console.log("Microphone access granted");
          
          // Direct approach - get a new stream every time
          console.log("Requesting media stream directly...");
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
          
          console.log("Successfully acquired media stream:", stream);
          setScreenStream(stream);
          
          // Set up transcription service using Web Speech API
          console.log("Setting up transcription service with Web Speech API");
          const transcriptionService = new WebSpeechTranscription(
            (text, isFinal) => {
              // Process transcription updates immediately without batching
              console.log(`Transcription ${isFinal ? 'final' : 'partial'}: ${text}`);
              
              if (!isFinal) {
                // Update live transcript immediately for word-by-word display
                // Force update to ensure responsive UI
                setLiveTranscript(prevText => {
                  // Only update if text has changed to avoid unnecessary renders
                  if (prevText !== text) {
                    return text;
                  }
                  return prevText;
                });
              } else if (text.trim() !== '') {
                // For final results, add to the history and clear live transcript
                setLiveTranscript("");
                
                // Get the previous transcript items to check for continuation of the same question
                const previousItems = [...transcript];
                const lastItem = previousItems.length > 0 ? previousItems[previousItems.length - 1] : null;
                
                // Check if this is likely a continuation of the same question (within 3 seconds and same speaker)
                const isContinuation = lastItem && 
                                     lastItem.speaker === (lastDetectedSpeaker || currentSpeaker) &&
                                     (new Date().getTime() - lastItem.timestamp.getTime() < 3000);
                
                // For multiple-choice questions, try to combine consecutive segments
                // This helps when the transcription service splits options across multiple segments
                const hasMultipleChoiceMarkers = /option\s+[abc]|ANSWER\s+OPTION\s+[ABC]|choose\s+[abc]/i.test(text);
                const lastItemHasOptionAorB = lastItem && /option\s+a|option\s+b|ANSWER\s+OPTION\s+A|ANSWER\s+OPTION\s+B/i.test(lastItem.text);
                
                if (isContinuation && (hasMultipleChoiceMarkers || lastItemHasOptionAorB)) {
                  // This is likely a continuation of a multiple-choice question, combine with the previous item
                  console.log("Detected continuation of multiple choice question, combining segments");
                  
                  // Update the last transcript item instead of adding a new one
                  previousItems[previousItems.length - 1] = {
                    ...lastItem,
                    text: `${lastItem.text} ${text}`,
                    timestamp: new Date() // Update timestamp
                  };
                  
                  setTranscript(previousItems);
                  
                  // Check if we now have a complete multiple-choice question with all options
                  const combinedText = previousItems[previousItems.length - 1].text;
                  const hasAllOptions = 
                    /option\s+a/i.test(combinedText) && 
                    /option\s+b/i.test(combinedText) && 
                    /option\s+c/i.test(combinedText);
                  
                  // If we have complete options, generate a response
                  if (hasAllOptions) {
                    console.log("Complete multiple choice question detected with all options");
                    // Create context from all previous transcript items
                    const context = previousItems.map(t => t.text).join(' ');
                    
                    setCurrentQuestion(combinedText);
                    
                    // Generate answer for the complete multiple-choice question
                    generateAnswerWithGemini(combinedText, context, 
                      userResume.trim() ? { userProvidedResume: userResume } : resumeInfo, 
                      jobDescription,
                      !!userResume.trim())
                      .then(answer => {
                        setAIResponses(prev => [
                          ...prev, 
                          {
                            id: `response-${Date.now()}`,
                            question: combinedText,
                            answer: answer,
                            timestamp: new Date(),
                            source: 'auto',
                            isMultipleChoice: true
                          }
                        ]);
                      })
                      .catch(err => {
                        console.error("Error generating answer:", err);
                      });
                  }
                } else {
                  // Add as a new transcript item
                  const newTranscriptItem = { 
                    id: `transcript-${Date.now()}`,
                    speaker: lastDetectedSpeaker || currentSpeaker,
                    text: text,
                    timestamp: new Date()
                  };
                  
                  setTranscript(prev => [...prev, newTranscriptItem]);
                  
                  // Check for questions for automatic answer generation
                  const hasQuestion = text.includes('?') || 
                                  text.toLowerCase().includes('tell me about') || 
                                  text.toLowerCase().includes('describe');
                  
                  // Check for multiple choice format
                  const hasMultipleChoiceFormat = /option\s+[abc]|answer\s+option\s+[abc]|ANSWER\s+OPTION\s+[ABC]/.test(text) || 
                                                 (text.includes('option A') && 
                                                  text.includes('option B') && 
                                                  text.includes('option C'));
                  
                  // Generate response for questions or multiple choice prompts
                  if (hasQuestion || hasMultipleChoiceFormat) {
                    // Create context from all previous transcript items plus the new one
                    const allTranscriptItems = [...previousItems, newTranscriptItem];
                    const context = allTranscriptItems.map(t => t.text).join(' ');
                    
                    setCurrentQuestion(text);
                    
                    // Generate answer using the combined context and resume info
                    generateAnswerWithGemini(text, context, 
                      userResume.trim() ? { userProvidedResume: userResume } : resumeInfo, 
                      jobDescription,
                      !!userResume.trim())
                      .then(answer => {
                        // Add response to suggestions
                        setAIResponses(prev => [
                          ...prev, 
                          {
                            id: `response-${Date.now()}`,
                            question: text,
                            answer: answer,
                            timestamp: new Date(),
                            source: 'auto',
                            isMultipleChoice: hasMultipleChoiceFormat
                          }
                        ]);
                      })
                      .catch(err => {
                        console.error("Error generating answer:", err);
                      });
                  }
                }
              }
            },
            (speaker) => {
              console.log("Speaker detected:", speaker);
              // Update the current speaker immediately
              setCurrentSpeaker(speaker);
            }
          );
          
          console.log("Connecting transcription service");
          await transcriptionService.connect();
          
          // Set up audio analysis
          console.log("Setting up audio analysis");
          try {
            // Use the audio stream from getUserMedia for more reliable audio analysis
            const processor = transcriptionService.setupAudioAnalysis(audioStream);
            
            // Store references for cleanup
            transcriptionRef.current = {
              service: transcriptionService,
              processor
            };
            
            setTranscriptionService(transcriptionService);
            setIsConnecting(false);
            console.log("Setup complete, interview ready");
          } catch (audioErr) {
            console.error("Error setting up audio analysis:", audioErr);
            // Continue without audio analysis if it fails
            transcriptionRef.current = {
              service: transcriptionService,
              processor: null
            };
            
            setTranscriptionService(transcriptionService);
            setIsConnecting(false);
            console.log("Setup complete without audio analysis");
          }
        } catch (err) {
          console.error('Error accessing media devices:', err);
          
          // Provide a more helpful error message based on the error
          let errorMessage = err instanceof Error ? err.message : String(err);
          if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
            errorMessage = 'Permission to access your screen and audio was denied. Please click "Share Screen" and allow access to continue.';
          } else if (errorMessage.includes('Speech recognition')) {
            errorMessage = 'Speech recognition is not supported in your browser. Please use Chrome or Edge for best results.';
          }
          
          setTranscriptionError(errorMessage);
          setIsConnecting(false);
        }
      } catch (error) {
        console.error('Error setting up interview:', error);
        setTranscriptionError(`An error occurred while setting up the interview: ${error instanceof Error ? error.message : String(error)}`);
        setIsConnecting(false);
      }
    };
    
    setupStream();
    
    // Clean up function
    return () => {
      safeCleanupResources();
    };
  }, []);
  
  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      const scrollContainer = transcriptRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [transcript, liveTranscript]);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const toggleListening = () => {
    if (isListening) {
      // Pause transcription
      console.log("Pausing transcription");
      setIsListening(false);
      
      // Safely pause without fully disconnecting
      if (transcriptionRef.current.service instanceof WebSpeechTranscription) {
        try {
          // For Web Speech API, we can temporarily stop recognition
          transcriptionRef.current.service.isReady = false;
          console.log("Web Speech recognition paused");
        } catch (err) {
          console.error("Error pausing Web Speech recognition:", err);
        }
      }
    } else {
      // Resume transcription
      console.log("Resuming transcription");
      setIsListening(true);
      
      if (transcriptionRef.current.service instanceof WebSpeechTranscription) {
        try {
          // For Web Speech API, we can restart recognition
          transcriptionRef.current.service.isReady = true;
          console.log("Web Speech recognition resumed");
          
          // Always try to reconnect - the service handles already running instances
          transcriptionRef.current.service.connect().catch(err => {
            console.error("Error reconnecting Web Speech recognition:", err);
            setTranscriptionError(`Failed to resume speech recognition: ${err instanceof Error ? err.message : String(err)}`);
          });
        } catch (err) {
          console.error("Error resuming Web Speech recognition:", err);
        }
      }
    }
  };
  
  const handleEndInterview = () => {
    // Clean up resources safely
    safeCleanupResources();
    
    // Navigate back to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, AUDIO_CLEANUP_TIMEOUT);
  };

  // Handle screen sharing setup
  const handleShareScreen = async () => {
    try {
      setIsConnecting(true);
      setTranscriptionError(null);
      console.log("Setting up screen sharing and audio...");
      
      // Clean up previous resources first to prevent AudioContext errors
      safeCleanupResources();
      
      // Get the screen sharing stream
      const videoStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: true // Try to capture audio directly from the tab if available
      } as MediaStreamConstraints);

      console.log("Screen sharing stream obtained:", videoStream.id);
      console.log("Video tracks:", videoStream.getVideoTracks().length);
      console.log("Audio tracks:", videoStream.getAudioTracks().length);

      // Store the stream for later use
      setScreenStream(videoStream);
      
      // Connect the video stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
        console.log("Video stream connected to video element");
      }

      // Initialize the transcription service
      console.log("Initializing transcription service...");
      
      // Function to handle new transcript data
      const handleTranscriptionData = (text: string, isFinal: boolean) => {
        console.log(`Transcription ${isFinal ? 'final' : 'partial'}: ${text}`);
        
        if (!isFinal) {
          // Update live transcript immediately for word-by-word display
          // Force update to ensure responsive UI
          setLiveTranscript(prevText => {
            // Only update if text has changed to avoid unnecessary renders
            if (prevText !== text) {
              return text;
            }
            return prevText;
          });
        } else if (text.trim() !== '') {
          // For final results, add to the history and clear live transcript
          setLiveTranscript("");
          
          // Get the previous transcript items to check for continuation of the same question
          const previousItems = [...transcript];
          const lastItem = previousItems.length > 0 ? previousItems[previousItems.length - 1] : null;
          
          // Check if this is likely a continuation of the same question (within 3 seconds and same speaker)
          const isContinuation = lastItem && 
                               lastItem.speaker === (lastDetectedSpeaker || currentSpeaker) &&
                               (new Date().getTime() - lastItem.timestamp.getTime() < 3000);
          
          // For multiple-choice questions, try to combine consecutive segments
          // This helps when the transcription service splits options across multiple segments
          const hasMultipleChoiceMarkers = /option\s+[abc]|ANSWER\s+OPTION\s+[ABC]|choose\s+[abc]/i.test(text);
          const lastItemHasOptionAorB = lastItem && /option\s+a|option\s+b|ANSWER\s+OPTION\s+A|ANSWER\s+OPTION\s+B/i.test(lastItem.text);
          
          if (isContinuation && (hasMultipleChoiceMarkers || lastItemHasOptionAorB)) {
            // This is likely a continuation of a multiple-choice question, combine with the previous item
            console.log("Detected continuation of multiple choice question, combining segments");
            
            // Update the last transcript item instead of adding a new one
            previousItems[previousItems.length - 1] = {
              ...lastItem,
              text: `${lastItem.text} ${text}`,
              timestamp: new Date() // Update timestamp
            };
            
            setTranscript(previousItems);
            
            // Check if we now have a complete multiple-choice question with all options
            const combinedText = previousItems[previousItems.length - 1].text;
            const hasAllOptions = 
              /option\s+a/i.test(combinedText) && 
              /option\s+b/i.test(combinedText) && 
              /option\s+c/i.test(combinedText);
            
            // If we have complete options, generate a response
            if (hasAllOptions) {
              console.log("Complete multiple choice question detected with all options");
              // Create context from all previous transcript items
              const context = previousItems.map(t => t.text).join(' ');
              
              setCurrentQuestion(combinedText);
              
              // Generate answer for the complete multiple-choice question
              generateAnswerWithGemini(combinedText, context, 
                userResume.trim() ? { userProvidedResume: userResume } : resumeInfo, 
                jobDescription,
                !!userResume.trim())
                .then(answer => {
                  setAIResponses(prev => [
                    ...prev, 
                    {
                      id: `response-${Date.now()}`,
                      question: combinedText,
                      answer: answer,
                      timestamp: new Date(),
                      source: 'auto',
                      isMultipleChoice: true
                    }
                  ]);
                })
                .catch(err => {
                  console.error("Error generating answer:", err);
                });
            }
          } else {
            // Add as a new transcript item
            const newTranscriptItem = { 
              id: `transcript-${Date.now()}`,
              speaker: lastDetectedSpeaker || currentSpeaker,
              text: text,
              timestamp: new Date()
            };
            
            setTranscript(prev => [...prev, newTranscriptItem]);
            
            // Check for questions for automatic answer generation
            const hasQuestion = text.includes('?') || 
                            text.toLowerCase().includes('tell me about') || 
                            text.toLowerCase().includes('describe');
            
            // Check for multiple choice format
            const hasMultipleChoiceFormat = /option\s+[abc]|answer\s+option\s+[abc]|ANSWER\s+OPTION\s+[ABC]/.test(text) || 
                                           (text.includes('option A') && 
                                            text.includes('option B') && 
                                            text.includes('option C'));
            
            // Generate response for questions or multiple choice prompts
            if (hasQuestion || hasMultipleChoiceFormat) {
              // Create context from all previous transcript items plus the new one
              const allTranscriptItems = [...previousItems, newTranscriptItem];
              const context = allTranscriptItems.map(t => t.text).join(' ');
              
              setCurrentQuestion(text);
              
              // Generate answer using the combined context and resume info
              generateAnswerWithGemini(text, context, 
                userResume.trim() ? { userProvidedResume: userResume } : resumeInfo, 
                jobDescription,
                !!userResume.trim())
                .then(answer => {
                  // Add response to suggestions
                  setAIResponses(prev => [
                    ...prev, 
                    {
                      id: `response-${Date.now()}`,
                      question: text,
                      answer: answer,
                      timestamp: new Date(),
                      source: 'auto',
                      isMultipleChoice: hasMultipleChoiceFormat
                    }
                  ]);
                })
                .catch(err => {
                  console.error("Error generating answer:", err);
                });
            }
          }
        }
      };
      
      // Function to handle speaker changes
      const handleSpeakerChange = (speaker: 'interviewer' | 'candidate') => {
        console.log('Speaker changed to:', speaker);
        setLastDetectedSpeaker(speaker);
        setCurrentSpeaker(speaker);
      };
      
      try {
        // Use the Web Speech API for transcription instead of AssemblyAI
        console.log("Using Web Speech API for transcription");
        const transcriptionService = new WebSpeechTranscription(
          handleTranscriptionData,
          handleSpeakerChange
        );
        
        console.log("Connecting transcription service...");
        await transcriptionService.connect();
        
        // Set up audio analysis for better speaker detection
        if (videoStream.getAudioTracks().length > 0) {
          console.log("Audio tracks found, setting up audio analysis");
          
          try {
            const processor = transcriptionService.setupAudioAnalysis(videoStream);
            setAudioProcessor(processor);
            
            // Store references for cleanup
            transcriptionRef.current = {
              service: transcriptionService,
              processor
            };
            
            setTranscriptionService(transcriptionService);
            setTranscriptionError(null);
            setIsConnecting(false);
            setIsTranscribing(true);
            console.log("Screen sharing and transcription setup complete!");
          } catch (audioErr) {
            console.error("Error setting up audio analysis:", audioErr);
            // We can continue without audio analysis - it's just for better speaker detection
            transcriptionRef.current = {
              service: transcriptionService,
              processor: null
            };
            
            setTranscriptionService(transcriptionService);
            setTranscriptionError(null);
            setIsConnecting(false);
            setIsTranscribing(true);
            console.log("Screen sharing and transcription setup complete (without audio analysis)!");
          }
        } else {
          console.warn("No audio tracks found in the stream");
          setTranscriptionError("No audio tracks found in the screen share. Please make sure to include audio when sharing your screen.");
          setIsConnecting(false);
        }
      } catch (transcriptionError) {
        console.error("Error setting up transcription:", transcriptionError);
        const errorMessage = transcriptionError instanceof Error ? transcriptionError.message : String(transcriptionError);
        setTranscriptionError(`Failed to set up transcription service: ${errorMessage}. Make sure your browser supports the Web Speech API.`);
        setIsConnecting(false);
        
        // Still allow the user to see their screen share even if transcription fails
        if (videoStream) {
          console.log("Continuing with screen display only (no transcription)");
        }
      }
    } catch (err) {
      console.error('Error selecting screen:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setTranscriptionError(`Failed to set up screen sharing: ${errorMessage}`);
      setIsConnecting(false);
    }
  };

  // Add a useEffect to clean up resources when the component unmounts
  useEffect(() => {
    return () => {
      // Clean up transcription service
      if (transcriptionRef.current?.service) {
        console.log("Cleaning up transcription service");
        transcriptionRef.current.service.disconnect();
      }
      
      // Clean up audio processor
      if (transcriptionRef.current?.processor) {
        console.log("Cleaning up audio processor");
        transcriptionRef.current.processor.stop();
      }
      
      // Clean up screen stream
      if (screenStream) {
        console.log("Cleaning up screen stream");
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screenStream]);

  // Add the useEffect when component mounts to activate the interview
  useEffect(() => {
    // Set interview as active after a small delay
    const timer = setTimeout(() => {
      setIsActive(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Add a new useEffect to handle the video element separately
  useEffect(() => {
    if (screenStream && videoRef.current) {
      console.log("Setting video source from screenStream effect");
      videoRef.current.srcObject = screenStream;
      videoRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded, playing video");
        videoRef.current?.play().catch(e => console.error("Error playing video:", e));
      };
    }
  }, [screenStream]);

  // Filter out sensitive content like emails and phone numbers
  const filterSensitiveContent = (text: string): string => {
    // Simple regex to catch common email formats
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // Simple regex to catch phone numbers
    const phoneRegex = /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
    
    // Replace with placeholders
    let filteredText = text.replace(emailRegex, '[email redacted]');
    filteredText = filteredText.replace(phoneRegex, '[phone redacted]');
    
    return filteredText;
  };
  
  // Helper function to extract option text from AI response
  const extractOptionText = (text: string, optionLetter: 'A' | 'B' | 'C'): string => {
    // Try different patterns to extract option text
    const patterns = [
      new RegExp(`Option ${optionLetter}:([\\s\\S]*?)(?:Option [ABC]:|OPTION [ABC]:|\\b[ABC]\\)|[Aa]\\.|\\b[Bb]\\.|\\b[Cc]\\.|$)`, 'i'),
      new RegExp(`OPTION ${optionLetter}:([\\s\\S]*?)(?:Option [ABC]:|OPTION [ABC]:|\\b[ABC]\\)|\\b[Aa]\\.|\\b[Bb]\\.|\\b[Cc]\\.|$)`, 'i'),
      new RegExp(`\\b${optionLetter}\\)([\\s\\S]*?)(?:Option [ABC]:|OPTION [ABC]:|\\b[ABC]\\)|\\b[Aa]\\.|\\b[Bb]\\.|\\b[Cc]\\.|$)`, 'i'),
      new RegExp(`\\b${optionLetter}\\.([\\s\\S]*?)(?:Option [ABC]:|OPTION [ABC]:|\\b[ABC]\\)|\\b[Aa]\\.|\\b[Bb]\\.|\\b[Cc]\\.|$)`, 'i'),
      new RegExp(`option ${optionLetter}[^:]*:([\\s\\S]*?)(?:Option [ABC]:|OPTION [ABC]:|\\b[ABC]\\)|\\b[Aa]\\.|\\b[Bb]\\.|\\b[Cc]\\.|$)`, 'i')
    ];
    
    // Try each pattern
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // If option text contains "Option A/B/C" without proper formatting, try to extract it
    if (text.includes(`Option ${optionLetter}`) || text.includes(`option ${optionLetter}`)) {
      const startIndex = text.indexOf(`Option ${optionLetter}`);
      if (startIndex !== -1) {
        // Find the next option or the end
        const nextOptionIndex = Math.min(
          text.indexOf(`Option ${String.fromCharCode(optionLetter.charCodeAt(0) + 1)}`, startIndex + 1) !== -1 
            ? text.indexOf(`Option ${String.fromCharCode(optionLetter.charCodeAt(0) + 1)}`, startIndex + 1) 
            : Number.MAX_SAFE_INTEGER,
          text.indexOf(`option ${String.fromCharCode(optionLetter.charCodeAt(0) + 1)}`, startIndex + 1) !== -1
            ? text.indexOf(`option ${String.fromCharCode(optionLetter.charCodeAt(0) + 1)}`, startIndex + 1)
            : Number.MAX_SAFE_INTEGER
        );
        
        if (nextOptionIndex !== Number.MAX_SAFE_INTEGER) {
          return text.substring(startIndex, nextOptionIndex).replace(`Option ${optionLetter}`, '').trim();
        } else {
          // Extract from the option to the recommendation section or end
          const recommendationIndex = text.indexOf('Recommendation:', startIndex);
          if (recommendationIndex !== -1) {
            return text.substring(startIndex, recommendationIndex).replace(`Option ${optionLetter}`, '').trim();
          } else {
            return text.substring(startIndex).replace(`Option ${optionLetter}`, '').trim();
          }
        }
      }
    }
    
    return '';
  };
  
  // Helper function to extract recommendation from AI response
  const extractRecommendation = (text: string): string => {
    // Common recommendation patterns
    const patterns = [
      /(?:recommend|choose|select|best choice is)\s+option\s+[ABC]/i,
      /(?:recommend|choose|select|best choice is)\s+[ABC]/i,
      /Option\s+[ABC]\s+(?:is recommended|is the best choice|would be best)/i,
      /(?:recommended choice|recommended option|best option|best choice)(?:\s+is)?\s+[ABC]/i,
      /[ABC]\s+(?:is|would be)\s+(?:the best|recommended|ideal|optimal|preferred)/i
    ];
    
    // Try to match the recommendation patterns
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    // Look for recommendation section
    const recommendationSectionMatch = text.match(/(?:recommendation|in conclusion|to summarize|therefore)[:\s]+([^.]+)/i);
    if (recommendationSectionMatch && recommendationSectionMatch[1]) {
      // Check if the captured group contains an option letter
      if (/\boption\s+[ABC]\b|\b[ABC]\b/i.test(recommendationSectionMatch[1])) {
        return recommendationSectionMatch[1].trim();
      }
    }
    
    return '';
  };

  // Add a function to completely reset speech recognition
  const resetSpeechRecognition = () => {
    console.log("Performing complete reset of speech recognition");
    
    // First, disconnect any existing service
    if (transcriptionRef.current.service) {
      try {
        transcriptionRef.current.service.disconnect();
      } catch (err) {
        console.error("Error disconnecting speech service:", err);
      }
    }
    
    // Wait a moment for everything to clean up
    setTimeout(async () => {
      try {
        // Create a new WebSpeechTranscription instance
        const newTranscriptionService = new WebSpeechTranscription(
          (text, isFinal) => {
            if (!isFinal) {
              setLiveTranscript(text);
            } else if (text.trim() !== '') {
              setLiveTranscript("");
              
              const newTranscriptItem = { 
                id: `transcript-${Date.now()}`,
                speaker: lastDetectedSpeaker || currentSpeaker,
                text: text,
                timestamp: new Date()
              };
              
              setTranscript(prev => [...prev, newTranscriptItem]);
            }
          },
          (speaker) => {
            setLastDetectedSpeaker(speaker);
            setCurrentSpeaker(speaker);
          }
        );
        
        // Connect the new service
        await newTranscriptionService.connect();
        
        // Update the reference
        transcriptionRef.current.service = newTranscriptionService;
        setTranscriptionService(newTranscriptionService);
        
        console.log("Speech recognition reset complete");
      } catch (err) {
        console.error("Error resetting speech recognition:", err);
        setSpeechRecognitionError("Failed to reset speech recognition. Please refresh the page.");
      }
    }, 500);
  };

  // Update handleGenerateAnswer to use the reset function
  const handleGenerateAnswer = async () => {
    // Collect all transcript text as context
    const transcriptText = transcript.map(item => item.text).join(' ');
    
    // Include live transcript if available
    const fullText = liveTranscript 
      ? `${transcriptText} ${liveTranscript}` 
      : transcriptText;
    
    if (fullText.trim() === '') {
      // Don't process empty transcript
      return;
    }
    
    // Check if resume is provided, and show a warning if not
    if (!userResume.trim()) {
      // Set a warning message
      setCurrentQuestion("For best results, please add your resume in the Key Insights tab before generating answers.");
      
      // Clear the warning after 5 seconds
      setTimeout(() => {
        if (currentQuestion === "For best results, please add your resume in the Key Insights tab before generating answers.") {
          setCurrentQuestion("");
        }
      }, 5000);
      
      return;
    }
    
    try {
      // Store the transcript before clearing (if needed for reference later)
      const transcriptToAnalyze = [...transcript];
      
      // Set loading state
      setIsGeneratingAnswer(true);
      
      // CRITICAL: Clear the transcript FIRST, before any async operations
      // This ensures the UI updates immediately
      setTranscript([]);
      setLiveTranscript("");
      
      // Force an immediate state update with a microtask
      await Promise.resolve();
      
      // Double-check transcript is cleared - use a direct DOM update if needed
      const transcriptContainer = document.querySelector('[data-radix-scroll-area-viewport]');
      if (transcriptContainer && transcriptContainer.textContent?.includes("platform")) {
        console.log("Forcing DOM-level transcript clear");
        if (transcriptContainer.firstChild) {
          transcriptContainer.textContent = "";
        }
      }
      
      // IMPORTANT: Reset speech recognition AFTER clearing the transcript
      // This prevents any race conditions where new transcription appears
      console.log("Resetting speech recognition after transcript cleared");
      resetSpeechRecognition();
      
      console.log("Sending transcript to Gemini for analysis:", fullText);
      
      // Show a loading state with appropriate message
      setCurrentQuestion(jobDescription.trim() 
        ? "Analyzing interview response for the target position..." 
        : "Analyzing interview response...");
      
      // For extra safety, force another transcript clear
      setTimeout(() => {
        // Triple-check transcript is cleared
        if (transcript.length > 0 || liveTranscript !== "") {
          console.log("Forcing secondary transcript clear");
          setTranscript([]);
          setLiveTranscript("");
        }
      }, 0);
      
      // Use a timer to show progress even if Gemini is taking time
      let progressTimer = setTimeout(() => {
        setCurrentQuestion(jobDescription.trim() && userResume.trim()
          ? "Crafting personalized response based on your resume and the job..."
          : "Crafting interview response...");
      }, 2500);
      
      // Send to Gemini for analysis (with a cleaner transcript to improve processing speed)
      // Trim down the fullText if it's very long to improve performance
      const compactText = fullText.length > 1500 ? fullText.slice(-1500) : fullText;
      
      // Use the user's resume if provided, otherwise fall back to the default resumeInfo
      const customResumeInfo = userResume.trim() ? { userProvidedResume: userResume } : resumeInfo;
      
      // Pass the job description and custom resume to Gemini
      const answer = await generateAnswerWithGemini(
        compactText, 
        compactText, 
        customResumeInfo, 
        jobDescription,
        !!userResume.trim() // Flag indicating if user provided their own resume
      );
      
      // Clear the timer
      clearTimeout(progressTimer);
      
      // Parse response to extract question and answer
      let extractedQuestion = '';
      let extractedAnswer = answer;
      
      // Try to parse the formatted response (QUESTION: ... ANSWER: ...)
      const questionMatch = answer.match(/QUESTION:\s*([\s\S]*?)(?=ANSWER:|$)/);
      const answerMatch = answer.match(/ANSWER:\s*([\s\S]*?)(?=$)/);
      
      if (questionMatch && questionMatch[1] && answerMatch && answerMatch[1]) {
        extractedQuestion = questionMatch[1].trim();
        extractedAnswer = answerMatch[1].trim();
        console.log("Successfully parsed formatted response");
      } else {
        // If parsing fails, try to extract what looks like a question
        const genericQuestionPattern = /\b(what|how|why|when|where|who|which|whose|can you|could you|tell me|explain|describe)[^?]+\?/i;
        const genQuestionMatch = fullText.match(genericQuestionPattern);
        
        if (genQuestionMatch) {
          extractedQuestion = genQuestionMatch[0].trim();
          console.log("Extracted question from transcript:", extractedQuestion);
        } else {
          // Use a default format
          extractedQuestion = "Latest interview question";
        }
      }
      
      // Clean up any unwanted context in both question and answer
      const contextToRemove = [
        /also helping you to save money by using resources and a frugal and responsible manner/i,
        /that is a crac?\.\.\./i
      ];
      
      // Filter out unwanted context
      contextToRemove.forEach(pattern => {
        extractedQuestion = extractedQuestion.replace(pattern, '').trim();
        extractedAnswer = extractedAnswer.replace(pattern, '').trim();
      });
      
      // Create a new response object
      const newResponse: AIResponse = {
        id: `response-${Date.now()}`,
        question: extractedQuestion,
        answer: extractedAnswer,
        timestamp: new Date(),
        source: 'manual',
        isMultipleChoice: false
      };
      
      // Add to responses
      setAIResponses(prev => [...prev, newResponse]);
      
      // Update current question with the extracted question
      setCurrentQuestion(extractedQuestion);
      
    } catch (err) {
      console.error("Error generating answer:", err);
      setCurrentQuestion("Error analyzing transcript. Please try again.");
      
      // Even on error, ensure transcript is cleared
      setTranscript([]);
      setLiveTranscript("");
    } finally {
      // Reset loading state
      setIsGeneratingAnswer(false);
      
      // No need to explicitly resume transcription since we've reset it
      // The new service is already running in the background
      console.log("Answer generation complete - speech recognition has been reset");
    }
  };

  // Add a useEffect to check for Web Speech API errors periodically
  useEffect(() => {
    if (!transcriptionService || !isListening) return;
    
    // Only run this for Web Speech API
    if (transcriptionService instanceof WebSpeechTranscription) {
      const checkErrorInterval = setInterval(() => {
        const errorMessage = transcriptionService.getLastErrorMessage();
        if (errorMessage) {
          console.log("Speech recognition error detected:", errorMessage);
          
          // Check if this is a recoverable error
          const isRecoverable = !errorMessage.includes("denied") && 
                               !errorMessage.includes("not supported");
          
          // Format a more user-friendly message with retry instructions if applicable
          const formattedMessage = isRecoverable 
            ? `${errorMessage} Automatically attempting to reconnect...`
            : errorMessage;
          
          setSpeechRecognitionError(formattedMessage);
          
          // Only auto-clear recoverable errors
          if (isRecoverable) {
            // Clear the error message after a few seconds
            setTimeout(() => {
              setSpeechRecognitionError(null);
            }, 5000);
          } else {
            // For non-recoverable errors, we'll keep the message displayed
            // until the user takes action
            console.warn("Non-recoverable speech recognition error:", errorMessage);
          }
          
          // For aborted errors during screen sharing, we'll try to handle them specially
          if (errorMessage.includes("aborted") && screenStream) {
            console.log("Aborted error during active screen sharing - this may be due to navigation");
            // These typically resolve themselves via the auto-reconnect mechanism
          }
        }
      }, 1000);
      
      return () => clearInterval(checkErrorInterval);
    }
  }, [transcriptionService, isListening, screenStream]);
  
  // Add a function to explicitly retry speech recognition
  const handleRetrySpeechRecognition = () => {
    console.log("Manually retrying speech recognition");
    setSpeechRecognitionError(null);
    
    if (transcriptionService instanceof WebSpeechTranscription) {
      // First disconnect
      transcriptionService.disconnect();
      
      // Then reconnect after a short delay
      setTimeout(async () => {
        try {
          await transcriptionService.connect();
          console.log("Successfully reconnected speech recognition");
        } catch (err) {
          console.error("Failed to reconnect speech recognition:", err);
          setSpeechRecognitionError("Failed to reconnect. Please refresh the page and try again.");
        }
      }, 1000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full w-full overflow-hidden">
      <div className="flex flex-col h-[50vh] lg:h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h2>Meeting View</h2>
            {isConnecting ? (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <span className="mr-1 h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Connecting...
              </Badge>
            ) : isListening ? (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                <span className="mr-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Paused
              </Badge>
            )}
          </div>
          <div className="flex-1 relative flex flex-col overflow-hidden">
            {transcriptionError ? (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-200 max-w-md">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Error</p>
                      <p>{transcriptionError}</p>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push('/dashboard')}
                          className="border-red-200 hover:bg-red-100"
                        >
                          Return to Dashboard
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={handleShareScreen}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full aspect-video relative bg-muted">
                  {screenStream ? (
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-contain" 
                      autoPlay 
                      playsInline
                      muted={true}
                      controls
                      style={{ background: 'black' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-muted-foreground">Waiting for screen sharing...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          The meeting view will be displayed here.
                        </p>
                        <Button
                          onClick={handleShareScreen}
                          variant="outline"
                          size="sm"
                          className="mt-4"
                        >
                          Share Screen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <ScrollArea className="flex-1 overflow-y-auto h-0 min-h-0" ref={transcriptRef}>
                  <div className="space-y-4 p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Live Transcript</h3>
                      <Button variant="ghost" size="sm" onClick={toggleListening} disabled={isConnecting}>
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Simplified transcript view - continuous paragraph */}
                    <div className="space-y-3">
                      {transcript.length === 0 && !liveTranscript && !isConnecting && (
                        <div className="text-center p-4 text-muted-foreground text-sm">
                          Waiting for interview conversation...
                        </div>
                      )}

                      {/* Single continuous paragraph for all transcript content */}
                      {(transcript.length > 0 || liveTranscript) && (
                        <>
                          <div className="p-3 rounded-md bg-background border">
                            <p className="text-sm">
                              {transcript.map((item, index) => (
                                <span key={item.id}>
                                  {index > 0 ? ' ' : ''}
                                  {filterSensitiveContent(item.text)}
                                </span>
                              ))}
                              {liveTranscript && (
                                <span>
                                  {transcript.length > 0 ? ' ' : ''}
                                  <span>
                                    {filterSensitiveContent(liveTranscript)}
                                  </span>
                                </span>
                              )}
                            </p>
                          </div>
                          
                          {/* Display speech recognition errors */}
                          {speechRecognitionError && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
                              <div className="flex items-start">
                                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-medium">Speech Recognition Issue</p>
                                  <p className="mt-1">{speechRecognitionError}</p>
                                  
                                  {/* Only show retry button for certain types of errors */}
                                  {(speechRecognitionError.includes("network") || 
                                    speechRecognitionError.includes("error") ||
                                    speechRecognitionError.includes("aborted") ||
                                    speechRecognitionError.includes("Failed")) && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2 bg-white hover:bg-white/90"
                                      onClick={handleRetrySpeechRecognition}
                                    >
                                      Retry Connection
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </ScrollArea>
                
                {/* Generate Answer Button - Made more prominent with centered position */}
                <div className="flex justify-center mt-4 mb-2">
                  <Button
                    variant="default"
                    onClick={handleGenerateAnswer}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 text-base"
                    disabled={transcript.length === 0 && !liveTranscript || isGeneratingAnswer}
                    size="lg"
                  >
                    {isGeneratingAnswer ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing Interview...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 text-white" />
                        Generate Answer
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col h-[50vh] lg:h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
            <h2>AI Assistant</h2>
              {(jobDescription.trim() || userResume.trim()) && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                  <Sparkle className="h-3 w-3 mr-1" />
                  Personalized
                </Badge>
              )}
            </div>
            {isConnecting ? (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <span className="mr-1 h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Connecting...
              </Badge>
            ) : isListening ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="mr-1 h-3 w-3" />
                AI Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Paused
              </Badge>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="suggestions" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="suggestions" className="flex items-center gap-2">
                  AI Suggestions
                  {jobDescription.trim() && userResume.trim() ? (
                    <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                      Fully Personalized
                    </span>
                  ) : jobDescription.trim() ? (
                    <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                      Job Tailored
                    </span>
                  ) : userResume.trim() ? (
                    <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                      Resume Based
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="insights">Key Insights</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="suggestions" className="m-0 h-full overflow-hidden">
                  <ScrollArea className="h-full overflow-y-auto">
                    <div className="space-y-4 p-4">
                    {currentQuestion ? (
                        <div className="bg-muted p-3 rounded-md border border-primary/20">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium flex items-center text-primary">
                              <Sparkle className="h-4 w-4 mr-1 text-primary" />
                              Interview Question:
                            </p>
                          <X className="h-4 w-4 cursor-pointer" onClick={() => setCurrentQuestion("")} />
                        </div>
                          <p className="text-sm mt-1">{currentQuestion}</p>
                      </div>
                    ) : !isConnecting && (
                      <div className="text-center p-4 text-muted-foreground text-sm">
                          {!userResume.trim() ? (
                            <div className="flex flex-col items-center space-y-2">
                              <p>Add your resume in the Key Insights tab to get started</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const insightsTab = document.querySelector('[data-state="inactive"][value="insights"]');
                                  if (insightsTab) {
                                    (insightsTab as HTMLElement).click();
                                  }
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Go to Key Insights
                              </Button>
                            </div>
                          ) : (
                            <p>Waiting for interview questions...</p>
                          )}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {/* Show loading state while generating answer */}
                      {isGeneratingAnswer && (
                          <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
                            <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="animate-pulse flex space-x-2 items-center">
                                <div className="h-2 w-2 bg-primary rounded-full animate-ping"></div>
                                <div className="h-2 w-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '300ms' }}></div>
                                <div className="h-2 w-2 bg-primary rounded-full animate-ping" style={{ animationDelay: '600ms' }}></div>
                            </div>
                              <p className="text-sm text-primary">
                                Analyzing with Gemini's fastest model{jobDescription.trim() ? " for job match" : ""}...
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                <div className="bg-primary h-1.5 rounded-full animate-progress"></div>
                              </div>
                              <p className="text-xs text-gray-500">Crafting professional response</p>
                          </div>
                        </div>
                      )}
                      
                        {/* Answers Container - With max height and scroll */}
                        <div className="border rounded-md overflow-hidden">
                          <div className="p-2 bg-muted border-b flex justify-between items-center">
                            <span className="text-sm font-medium">Interview Answers</span>
                            <span className="text-xs text-muted-foreground">Latest at top</span>
                          </div>
                          <div className="p-2 space-y-3 max-h-[calc(100vh-24rem)] overflow-y-auto">
                            {aiResponses.length > 0 ? (
                              [...aiResponses].reverse().map((response) => {
                                // First, clean the response text to remove any context that might have been missed
                                const cleanAnswer = response.answer
                                  .replace(/also helping you to save money by using resources and a frugal and responsible manner/ig, '')
                                  .replace(/that is a crac?\.\.\./ig, '')
                                  .trim();
                                
                                return (
                                  <div key={response.id} className="flex flex-col space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-sm font-semibold text-primary">
                                          {response.isMultipleChoice ? 'Multiple Choice Analysis:' : 'Engineering Response:'}
                              </span>
                              <div className="text-xs text-muted-foreground">
                                {formatTime(response.timestamp)}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                                        onClick={() => handleCopy(cleanAnswer, response.id)}
                              className="h-6 w-6 p-0"
                              title="Copy to clipboard"
                            >
                              {copiedId === response.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                                    
                                    {/* Display the question the response is for - but not the full transcript */}
                                    {response.question && response.question !== "Latest interview question" && !response.question.includes("also helping you to save money") && (
                                      <div className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2 py-1">
                                        Question: {response.question.length > 100 ? 
                                          `${response.question.substring(0, 100)}...` : 
                                          response.question}
                                      </div>
                                    )}
                          
                          {response.isMultipleChoice ? (
                            <div className="mt-2 space-y-3">
                                        {/* Multiple choice rendering code */}
                                        {cleanAnswer.split(/Option [ABC]:|OPTION [ABC]:|[ABC]\)|[Aa]\.|\b[Bb]\.|\b[Cc]\./)[0] && (
                                          <p key="intro" className="text-sm mb-3">{cleanAnswer.split(/Option [ABC]:|OPTION [ABC]:|[ABC]\)|[Aa]\.|\b[Bb]\.|\b[Cc]\./)[0].trim()}</p>
                              )}
                              
                              {/* Use more robust pattern matching to extract options */}
                              <div className="space-y-3">
                                {/* Extract Option A */}
                                          {extractOptionText(cleanAnswer, 'A').trim() && (
                                            <div className="text-sm border-l-2 pl-3 py-1 bg-indigo-50" style={{ borderColor: '#4f46e5' }}>
                                    <span className="font-medium" style={{ color: '#4f46e5' }}>
                                      Option A:
                                    </span>{' '}
                                              {extractOptionText(cleanAnswer, 'A')}
                                  </div>
                                )}
                                
                                {/* Extract Option B */}
                                          {extractOptionText(cleanAnswer, 'B').trim() && (
                                            <div className="text-sm border-l-2 pl-3 py-1 bg-cyan-50" style={{ borderColor: '#0891b2' }}>
                                    <span className="font-medium" style={{ color: '#0891b2' }}>
                                      Option B:
                                    </span>{' '}
                                              {extractOptionText(cleanAnswer, 'B')}
                                  </div>
                                )}
                                
                                {/* Extract Option C */}
                                          {extractOptionText(cleanAnswer, 'C').trim() && (
                                            <div className="text-sm border-l-2 pl-3 py-1 bg-emerald-50" style={{ borderColor: '#059669' }}>
                                    <span className="font-medium" style={{ color: '#059669' }}>
                                      Option C:
                                    </span>{' '}
                                              {extractOptionText(cleanAnswer, 'C')}
                                  </div>
                                )}
                              </div>
                              
                              {/* Extract recommendation using more robust pattern matching */}
                                        {extractRecommendation(cleanAnswer) && (
                                <div className="bg-green-50 p-3 rounded-md text-sm mt-3 border border-green-200">
                                  <span className="font-semibold text-green-800">Recommendation: </span>
                                            {extractRecommendation(cleanAnswer)}
                                </div>
                              )}
                            </div>
                          ) : (
                                      <div className="text-sm p-2 bg-white rounded border border-gray-100">
                                        {cleanAnswer}
                                      </div>
                          )}
                        </div>
                                );
                              })
                            ) : (
                              <div className="text-center p-4 text-muted-foreground text-sm">
                                No answers generated yet. Click "Generate Answer" to create a response.
                    </div>
                            )}
                  </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="insights" className="m-0 h-full overflow-hidden">
                  <ScrollArea className="h-full overflow-y-auto">
                    <div className="space-y-4 p-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Job Description</h3>
                        <div className="space-y-2">
                          <div className="relative">
                            <textarea 
                              className="w-full p-3 h-24 text-sm rounded-md border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="Enter job description here to tailor AI responses to the specific role..."
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                            />
                            {jobDescription.trim() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                                onClick={() => setJobDescription("")}
                                title="Clear job description"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {jobDescription.trim() ? (
                            <div className="p-2 bg-primary/5 rounded-md border border-primary/10 text-xs">
                              <div className="flex items-center text-primary font-medium mb-1">
                                <Sparkle className="h-3 w-3 mr-1" />
                                <span>AI responses will be tailored to this job description</span>
                              </div>
                              <p className="text-muted-foreground">
                                Add specific skills or requirements from the job posting for best results
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Adding a job description helps AI generate more relevant answers focused on the position
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Your Resume/CV</h3>
                        <div className="space-y-2">
                          <div className="relative">
                            <textarea 
                              className="w-full p-3 h-32 text-sm rounded-md border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="Required: Enter your resume details here (skills, experience, education, achievements)..."
                              value={userResume}
                              onChange={(e) => setUserResume(e.target.value)}
                            />
                            {userResume.trim() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full"
                                onClick={() => setUserResume("")}
                                title="Clear resume"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {userResume.trim() ? (
                            <div className="p-2 bg-primary/5 rounded-md border border-primary/10 text-xs">
                              <div className="flex items-center text-primary font-medium mb-1">
                                <Sparkle className="h-3 w-3 mr-1" />
                                <span>AI will personalize answers based on your resume</span>
                              </div>
                              <p className="text-muted-foreground">
                                Include key skills, experiences, and achievements for more relevant responses
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-xs">
                              <div className="flex items-center font-medium mb-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                <span>Resume required for personalized answers</span>
                              </div>
                              <p>
                                Please add your resume details to generate relevant interview responses
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                    <div>
                      <h3 className="text-sm font-medium mb-2">Interview Progress</h3>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm">{transcript.length > 0 ? `${Math.round(transcript.length / 2)} minutes elapsed` : 'Interview not yet started'}</p>
                        <p className="text-sm">{transcript.filter(t => t.speaker === 'interviewer').length} questions asked</p>
                          <p className="text-sm">{transcript.length > 0 ? `${aiResponses.length} questions answered` : 'Waiting for questions'}</p>
                      </div>
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-medium mb-2">Recent Questions</h3>
                        <div className="space-y-2">
                          {aiResponses.length > 0 ? (
                            <div className="space-y-2">
                              {aiResponses.slice(-3).reverse().map((response, idx) => (
                                <div key={idx} className="text-sm p-2 bg-muted rounded-md">
                                  {response.question || "Interview question"}
                                </div>
                              ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No questions answered yet</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                        <h3 className="text-sm font-medium mb-2">Tips for Interview Success</h3>
                        <div className="space-y-2">
                          <p className="text-sm">• Highlight your relevant expertise and experience</p>
                          <p className="text-sm">• Mention specific achievements with quantifiable results</p>
                          <p className="text-sm">• Emphasize experience that matches the job requirements</p>
                          {jobDescription.trim() && userResume.trim() && (
                            <p className="text-sm text-primary">• Your resume has been matched to the job description for tailored answers</p>
                      )}
                    </div>
                  </div>
                    </div>
              </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 