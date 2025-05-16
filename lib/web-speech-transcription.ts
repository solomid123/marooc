// Web Speech API-based transcription service
// Uses the browser's built-in speech recognition capabilities

// TypeScript declarations for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

// Add SpeechRecognition to window interface
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface WebSpeechTranscriptionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

export class WebSpeechTranscription {
  private recognition: SpeechRecognition | null = null;
  private isRecognizing: boolean = false;
  onTranscriptUpdate: (text: string, isFinal: boolean) => void;
  onSpeakerChange: (speaker: 'interviewer' | 'candidate') => void;
  isReady: boolean = false;
  private lastTranscript: string = '';
  private speakerChangeTimeout: NodeJS.Timeout | null = null;
  private currentSpeaker: 'interviewer' | 'candidate' = 'interviewer';
  private silenceTimer: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private options: WebSpeechTranscriptionOptions;
  private lastErrorMessage: string | null = null;
  
  constructor(
    onTranscriptUpdate: (text: string, isFinal: boolean) => void,
    onSpeakerChange: (speaker: 'interviewer' | 'candidate') => void,
    options: WebSpeechTranscriptionOptions = {}
  ) {
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onSpeakerChange = onSpeakerChange;
    this.options = {
      continuous: true,
      interimResults: true,
      lang: 'en-US',
      ...options
    };
    
    // Check if SpeechRecognition is available
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
         
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        
        // Configure for more responsive recognition
        if (this.recognition) {
          this.recognition.continuous = true;
          this.recognition.interimResults = true; // Important for word-by-word updates
          this.recognition.maxAlternatives = 1;
          
          // Configure for faster, more responsive updates
          try {
            // @ts-ignore - These are Chrome-specific but help with more frequent updates
            this.recognition.interimResultsCallback = true;
            
            // @ts-ignore - Make updates happen more frequently (lower values = more updates)
            if ('maxAlternatives' in this.recognition) {
              this.recognition.maxAlternatives = 1;
            }
            
            // @ts-ignore - New property to improve responsiveness (if supported)
            if ('instantResults' in this.recognition) {
              this.recognition.instantResults = true;
            }
          } catch (e) {
            // Ignore errors for browsers that don't support these properties
            console.log("Some advanced speech recognition settings aren't supported in this browser");
          }
        }
        
        console.log("Web Speech API supported");
      } else {
        console.error("Web Speech API not supported in this browser");
      }
    }
  }
  
  async connect(): Promise<void> {
    console.log("Initializing Web Speech API transcription");
    
    if (!this.recognition) {
      console.error("Speech recognition not available");
      // Throw a more descriptive error to help users
      throw new Error(
        "Speech recognition is not supported in your browser. " +
        "Please use Chrome, Edge, or Safari for best results. " +
        "Firefox requires enabling the 'media.webspeech.recognition.enable' flag in about:config."
      );
    }
    
    // If already recognizing, don't start again
    if (this.isRecognizing) {
      console.log("Speech recognition already running");
      return Promise.resolve();
    }
    
    // Flag that we're ready to start
    this.isReady = true;
    
    // Configure the recognition
    this.recognition.continuous = this.options.continuous || true;
    this.recognition.interimResults = this.options.interimResults || true;
    this.recognition.lang = this.options.lang || 'en-US';
    
    // Set additional parameters for better responsiveness
    try {
      // @ts-ignore - Chrome specific properties for more frequent updates
      if ('audioStart' in this.recognition) {
        this.recognition.audioStart = 0.01; // Lower threshold to start recognition
      }
      
      // Try to attach additional event handlers if available
      // Use a safer approach with try/catch for each handler
      try {
        // @ts-ignore - TypeScript doesn't know about this Chrome-specific event
        this.recognition.onspeechstart = function() {
          console.log("Speech started");
        };
      } catch (eventError) {
        // Ignore if not supported
      }
    } catch (e) {
      console.log("Some speech recognition events aren't supported");
    }
    
    // Set up event handlers
    this.recognition.onstart = () => {
      console.log("Speech recognition started");
      this.isRecognizing = true;
    };
    
    this.recognition.onend = () => {
      console.log("Speech recognition ended");
      this.isRecognizing = false;
      
      // Automatically restart if it stops unexpectedly and isReady is true
      if (this.isReady) {
        console.log("Restarting speech recognition");
        try {
          // Use a longer delay to prevent rapid cycling during transitions
          setTimeout(() => {
            try {
              // Double-check that we're still ready before restarting
              if (this.isReady && !this.isRecognizing) {
                console.log("Executing delayed restart of speech recognition");
                this.recognition?.start();
              } else {
                console.log("Skipping restart as conditions changed");
              }
            } catch (startErr) {
              console.error("Error in delayed speech recognition restart:", startErr);
            }
          }, 500); // Increased delay to avoid immediate restart issues
        } catch (err) {
          console.error("Error restarting speech recognition:", err);
        }
      }
    };
    
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      // Combine the results immediately for real-time response
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      // Always send interim results immediately for real-time display
      // Without any delay or debouncing for immediate word-by-word updates
      if (interimTranscript !== '') {
        // Send immediately even for small transcript changes
        this.onTranscriptUpdate(interimTranscript, false);
      }
      
      // Handle final transcript
      if (finalTranscript !== '') {
        console.log("Final transcript:", finalTranscript);
        this.lastTranscript = finalTranscript;
        this.onTranscriptUpdate(finalTranscript, true);
        
        // Simple speaker detection based on timing
        if (this.speakerChangeTimeout) {
          clearTimeout(this.speakerChangeTimeout);
        }
        
        this.speakerChangeTimeout = setTimeout(() => {
          // Swap the speaker for the next utterance
          this.currentSpeaker = this.currentSpeaker === 'interviewer' ? 'candidate' : 'interviewer';
          console.log("Speaker changed to:", this.currentSpeaker);
          this.onSpeakerChange(this.currentSpeaker);
        }, 1000);
      }
    };
    
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      // Handle different error types more gracefully
      switch (event.error) {
        case 'network':
          console.log("Network error detected, will retry reconnection in 3 seconds");
          // Set a UI-friendly message that can be displayed to the user
          this.lastErrorMessage = "Network connection issue detected. Reconnecting...";
          
          // For network errors, wait a bit longer before reconnecting
          setTimeout(() => {
            if (this.isReady && !this.isRecognizing) {
              try {
                console.log("Attempting to reconnect after network error");
                this.recognition?.start();
              } catch (err) {
                console.error("Error restarting speech recognition after network error:", err);
              }
            }
          }, 3000);
          break;
          
        case 'aborted':
          console.log("Speech recognition aborted - this often happens during navigation or when sharing screens");
          // Not setting an error message for users since this is expected during navigation
          
          // Check if we're sharing a screen - if so, this is likely from page navigation
          if (document.documentElement.getAttribute('data-sharing') === 'active') {
            console.log("Sharing is active, aborted error is expected during navigation");
            // Don't restart immediately, as we're likely navigating between pages
            setTimeout(() => {
              if (this.isReady && !this.isRecognizing) {
                try {
                  console.log("Restarting recognition after navigation");
                  this.recognition?.start();
                } catch (err) {
                  console.error("Error restarting speech recognition after navigation:", err);
                }
              }
            }, 2000); // Longer delay for navigation
          } else {
            // Normal abort, try restarting soon
            setTimeout(() => {
              if (this.isReady && !this.isRecognizing) {
                try {
                  console.log("Restarting recognition after aborted error");
                  this.recognition?.start();
                } catch (err) {
                  console.error("Error restarting speech recognition after aborted:", err);
                }
              }
            }, 1000);
          }
          break;
          
        case 'no-speech':
          console.log("No speech detected, will restart recognition in 1 second");
          // Set a UI-friendly message
          this.lastErrorMessage = "No speech detected. Make sure your microphone is working and you are speaking.";
          
          // For no-speech, try again more quickly
          setTimeout(() => {
            if (this.isReady && !this.isRecognizing) {
              try {
                console.log("Restarting recognition after no-speech error");
                this.recognition?.start();
              } catch (err) {
                console.error("Error restarting speech recognition after no-speech:", err);
              }
            }
          }, 1000);
          break;
          
        case 'not-allowed':
        case 'service-not-allowed':
          console.error("Microphone access denied by user or system");
          this.lastErrorMessage = "Microphone access was denied. Please allow microphone access in your browser settings.";
          this.isReady = false; // Don't auto-restart if permission was denied
          break;
          
        default:
          console.log(`Unhandled speech recognition error: ${event.error}`);
          this.lastErrorMessage = `Speech recognition error: ${event.error}. Will try to reconnect.`;
          
          // For other errors, use the standard restart mechanism
          setTimeout(() => {
            if (this.isReady && !this.isRecognizing) {
              try {
                this.recognition?.start();
              } catch (err) {
                console.error("Error restarting speech recognition after error:", err);
              }
            }
          }, 1000);
      }
    };
    
    // Start recognition with a slight delay to avoid issues during screen sharing
    // This helps prevent the "aborted" error during navigation
    console.log("Waiting briefly before starting speech recognition...");
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // Check if screen sharing is happening
          const isSharing = document.documentElement.getAttribute('data-sharing') === 'active';
          
          if (isSharing) {
            console.log("Screen sharing detected, using longer initialization delay");
            // Use even longer delay when screen sharing is active
            setTimeout(() => {
              if (this.isReady && !this.isRecognizing) {
                console.log("Starting speech recognition after screen sharing delay");
                this.recognition?.start();
              }
              resolve();
            }, 1000);
          } else {
            // Start right away if not sharing
            console.log("Starting speech recognition");
            this.recognition?.start();
            resolve();
          }
        } catch (err) {
          console.error("Error starting speech recognition:", err);
          resolve(); // Resolve anyway to prevent hanging
        }
      }, 300); // Short initial delay
    });
  }
  
  async waitForConnection(timeoutMs = 5000): Promise<boolean> {
    console.log("Waiting for speech recognition to be ready");
    
    if (this.isReady) {
      return Promise.resolve(true);
    }
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isReady) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      
      // Timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!this.isReady) {
          console.warn("Timeout waiting for speech recognition");
          resolve(false);
        }
      }, timeoutMs);
    });
  }
  
  setupAudioAnalysis(stream: MediaStream) {
    try {
      this.audioContext = new AudioContext();
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      this.mediaStreamSource.connect(this.audioAnalyser);
      
      // Configure the analyser
      this.audioAnalyser.fftSize = 256;
      const bufferLength = this.audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Set up a interval to check audio levels and detect silence
      const checkAudioLevel = () => {
        if (!this.audioAnalyser) return;
        
        this.audioAnalyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Detect silence and potential speaker changes
        if (average < 10) { // Low audio level threshold
          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              console.log("Silence detected, possible speaker change");
              // This could be a good time to swap speakers
              if (this.lastTranscript !== '') {
                this.currentSpeaker = this.currentSpeaker === 'interviewer' ? 'candidate' : 'interviewer';
                this.onSpeakerChange(this.currentSpeaker);
              }
              this.silenceTimer = null;
            }, 1500); // 1.5 seconds of silence suggests a speaker change
          }
        } else {
          // Reset silence timer if audio detected
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
        }
      };
      
      // Check audio level every 500ms
      const audioCheckInterval = setInterval(checkAudioLevel, 500);
      
      return {
        stop: () => {
          clearInterval(audioCheckInterval);
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          if (this.mediaStreamSource) {
            this.mediaStreamSource.disconnect();
          }
          if (this.audioContext) {
            this.audioContext.close();
          }
        }
      };
    } catch (err) {
      console.error("Error setting up audio analysis:", err);
      return {
        stop: () => {
          console.log("No audio analysis to stop");
        }
      };
    }
  }
  
  // This mimics the sendAudio method from the AssemblyAI service
  // but we don't actually need to send audio - the browser handles that
  sendAudio(audioData: Float32Array) {
    // No action needed - Web Speech API listens directly
    return;
  }
  
  // New public method to check status
  isActive(): boolean {
    return this.isReady && this.recognition !== null;
  }
  
  // Add a new method to clear any pending transcriptions
  clearTranscriptions() {
    console.log("Clearing any pending transcriptions");
    
    // Stop and restart recognition to clear the buffer
    if (this.recognition && this.isRecognizing) {
      try {
        // Stop the current recognition session
        this.recognition.abort();
        
        // Clear any pending timeouts
        if (this.speakerChangeTimeout) {
          clearTimeout(this.speakerChangeTimeout);
          this.speakerChangeTimeout = null;
        }
        
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
        
        // Clear the last transcript
        this.lastTranscript = '';
        
        // If we're supposed to be ready, restart after a short delay
        if (this.isReady) {
          setTimeout(() => {
            if (this.isReady && !this.isRecognizing && this.recognition) {
              try {
                this.recognition.start();
              } catch (err) {
                console.error("Error restarting recognition after clearing:", err);
              }
            }
          }, 300);
        }
      } catch (err) {
        console.error("Error clearing transcriptions:", err);
      }
    }
  }
  
  // Modify the disconnect method to properly stop recognition
  disconnect() {
    console.log("Disconnecting Web Speech transcription service");
    
    // Set ready state to false to prevent auto-restarts
    this.isReady = false;
    
    // Clear any pending timeouts
    if (this.speakerChangeTimeout) {
      clearTimeout(this.speakerChangeTimeout);
      this.speakerChangeTimeout = null;
    }
    
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    // Force a proper disconnect, handling any errors
    const performDisconnect = () => {
      // Stop recognition if it's running
      if (this.recognition) {
        try {
          if (this.isRecognizing) {
            this.recognition.abort();
          }
          
          // Clear reference to the recognition object
          this.recognition = null;
        } catch (error) {
          console.error("Error stopping speech recognition:", error);
        }
      }
      
      // Clean up audio analysis resources
      if (this.mediaStreamSource) {
        try {
          this.mediaStreamSource.disconnect();
          this.mediaStreamSource = null;
        } catch (error) {
          console.error("Error disconnecting media stream source:", error);
        }
      }
      
      if (this.audioAnalyser) {
        try {
          this.audioAnalyser.disconnect();
          this.audioAnalyser = null;
        } catch (error) {
          console.error("Error disconnecting audio analyser:", error);
        }
      }
      
      if (this.audioContext) {
        try {
          this.audioContext.close();
          this.audioContext = null;
        } catch (error) {
          console.error("Error closing audio context:", error);
        }
      }
    };
    
    // Perform disconnect with small delay to ensure all events are processed
    setTimeout(performDisconnect, 100);
    
    // Reset transcript state
    this.lastTranscript = '';
    this.isRecognizing = false;
    
    return Promise.resolve();
  }
  
  // Add a method to get the last error message and reset it
  getLastErrorMessage(): string | null {
    const message = this.lastErrorMessage;
    this.lastErrorMessage = null; // Reset after reading
    return message;
  }
} 