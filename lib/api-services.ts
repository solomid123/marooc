import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AssemblyAI client
const ASSEMBLY_AI_API_KEY = 'cdd03ced259e446a962fea897841d6d1';

// Initialize Gemini API client
const GEMINI_API_KEY = 'AIzaSyBOOK8h99F0T9bQmlXNHgm6d6IwnCL30UY';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Use Gemini's fastest model for maximum speed
const MODEL_NAME = 'gemini-1.5-flash';

// AssemblyAI WebSocket for real-time transcription
export class AssemblyAIRealTimeTranscription {
  socket: WebSocket | null = null;
  onTranscriptUpdate: (text: string, isFinal: boolean) => void;
  onSpeakerChange: (speaker: 'interviewer' | 'candidate') => void;
  sessionId: string;
  isReady: boolean = false;
  connectionPromise: Promise<boolean> | null = null;
  private resolveConnection: ((value: boolean) => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private temporaryToken: string | null = null;

  constructor(
    onTranscriptUpdate: (text: string, isFinal: boolean) => void,
    onSpeakerChange: (speaker: 'interviewer' | 'candidate') => void
  ) {
    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onSpeakerChange = onSpeakerChange;
    this.sessionId = Math.random().toString(36).substring(2, 15);
    // Create a promise that will resolve when the connection is ready
    this.connectionPromise = new Promise((resolve) => {
      this.resolveConnection = resolve;
    });
  }

  // Get a temporary token from AssemblyAI for WebSocket authentication
  private async getTemporaryToken(): Promise<string | null> {
    try {
      console.log("Requesting temporary token from AssemblyAI");
      
      // Use our own API endpoint instead of calling AssemblyAI directly from the browser
      // This avoids CORS issues
      const response = await fetch('/api/assembly-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Received temporary token from AssemblyAI");
      this.temporaryToken = data.token;
      return data.token;
    } catch (error) {
      console.error("Error getting temporary token:", error);
      return null;
    }
  }

  async connect() {
    console.log("Initializing AssemblyAI WebSocket connection");
    try {
      // Reset the ready state
      this.isReady = false;
      
      // Create a new connection promise
      this.connectionPromise = new Promise((resolve) => {
        this.resolveConnection = resolve;
      });
      
      // Test API key format (basic validation)
      if (!ASSEMBLY_AI_API_KEY || ASSEMBLY_AI_API_KEY.length < 10) {
        console.error("Invalid AssemblyAI API key format:", ASSEMBLY_AI_API_KEY);
        if (this.resolveConnection) this.resolveConnection(false);
        return;
      }
      
      // Get temporary token for WebSocket authentication
      const token = await this.getTemporaryToken();
      if (!token) {
        console.error("Failed to get temporary token for WebSocket connection");
        if (this.resolveConnection) this.resolveConnection(false);
        return;
      }
      
      // Create a WebSocket connection to AssemblyAI
      // Using 44100 sample rate which is what most modern browsers use
      const websocketUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=44100&speaker_labels=true`;
      console.log("Connecting to WebSocket URL:", websocketUrl);
      this.socket = new WebSocket(websocketUrl);
      
      // Debug the socket creation
      console.log("WebSocket object created:", this.socket ? "success" : "failed", "State:", this.socket?.readyState);
      
      this.socket.onopen = () => {
        console.log("WebSocket connection opened, sending authentication");
        // Send the temporary token for authentication
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          const authMessage = JSON.stringify({ 
            token: token
          });
          this.socket.send(authMessage);
          console.log('Sent authentication message to AssemblyAI WebSocket');
          // Reset reconnect attempts on successful connection
          this.reconnectAttempts = 0;
        } else {
          console.error('Cannot send authentication: WebSocket not ready, state:', this.socket?.readyState);
          if (this.resolveConnection) this.resolveConnection(false);
        }
      };

      this.socket.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          
          // Log the message type for debugging
          console.log("Received message type:", data.message_type, data);
          
          if (data.message_type === 'FinalTranscript' || data.message_type === 'PartialTranscript') {
            const isFinal = data.message_type === 'FinalTranscript';
            
            if (data.text && data.text.trim() !== '') {
              console.log(`Processing ${isFinal ? 'final' : 'partial'} transcript:`, data.text);
              this.onTranscriptUpdate(data.text, isFinal);
              
              // If speaker labels are available and this is a final transcript
              if (isFinal && data.speaker && data.speaker !== null) {
                // Simplify to our two-speaker model (interviewer or candidate)
                // By default in our UI, we're assuming speaker "A" is interviewer and "B" is candidate
                const speaker = data.speaker === 'A' ? 'interviewer' : 'candidate';
                console.log("Speaker detected:", speaker);
                this.onSpeakerChange(speaker);
              }
            }
          } else if (data.message_type === 'SessionBegins') {
            console.log("AssemblyAI session successfully started with session ID:", data.session_id);
            // Now we're ready to send audio data
            this.isReady = true;
            if (this.resolveConnection) this.resolveConnection(true);
          } else if (data.message_type === 'SessionTerminated') {
            console.log("AssemblyAI session terminated:", data.termination_reason);
            this.isReady = false;
            
            // Try to reconnect if terminated unexpectedly
            if (data.termination_reason !== "USER_DISCONNECTED") {
              this.attemptReconnect();
            }
          } else if (data.message_type === 'Error') {
            console.error("AssemblyAI error:", data.error, "Details:", data);
            
            // Handle authentication errors specifically
            if (data.error && (data.error.includes("auth") || data.error.includes("token") || data.error.includes("key"))) {
              console.error("Authentication error with AssemblyAI - check your API key");
            }
            
            this.isReady = false;
            if (this.resolveConnection) this.resolveConnection(false);
            
            // Try to reconnect on error
            this.attemptReconnect();
          }
        } catch (err) {
          console.error("Error processing message:", err, "Raw message:", message.data);
        }
      };

      this.socket.onerror = (error) => {
        console.error('AssemblyAI WebSocket Error:', error);
        this.isReady = false;
        if (this.resolveConnection) this.resolveConnection(false);
        
        // Try to reconnect on error
        this.attemptReconnect();
      };

      this.socket.onclose = (event) => {
        console.log(`AssemblyAI WebSocket Disconnected: Code: ${event.code}, Reason: ${event.reason}`);
        this.isReady = false;
        
        // Try to reconnect on unexpected close
        if (event.code !== 1000) { // 1000 is normal closure
          this.attemptReconnect();
        }
      };
    } catch (err) {
      console.error("Error establishing WebSocket connection:", err);
      this.isReady = false;
      if (this.resolveConnection) this.resolveConnection(false);
      
      // Try to reconnect on error
      this.attemptReconnect();
    }
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(3000 * this.reconnectAttempts, 15000); // Exponential backoff with max 15 seconds
      
      console.log(`Attempting to reconnect WebSocket... Attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts} in ${delay/1000} seconds`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts. Please check your API key and connection.`);
    }
  }

  async waitForConnection(timeoutMs = 10000): Promise<boolean> {
    if (this.isReady) return true;
    
    if (!this.connectionPromise) {
      return false;
    }
    
    try {
      // Add timeout to the promise
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), timeoutMs);
      });
      
      return await Promise.race([this.connectionPromise, timeoutPromise]);
    } catch (err) {
      console.error("Error waiting for connection:", err);
      return false;
    }
  }

  async sendAudio(audioData: Float32Array) {
    // Check if we're ready, wait for up to 1 second if not
    if (!this.isReady) {
      const connectionResult = await this.waitForConnection(1000);
      if (!connectionResult) {
        console.log("Waiting for WebSocket connection to be ready...");
        return; // Don't try to send audio yet
      }
    }
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        // Convert Float32Array to Int16Array for AssemblyAI
        const audioDataInt16 = new Int16Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          // Scale and clip the float32 values to fit into int16 range
          // Float32Array values are in [-1, 1], Int16Array values are in [-32768, 32767]
          const scaled = Math.max(-1, Math.min(1, audioData[i])) * 32767;
          audioDataInt16[i] = Math.round(scaled);
        }
        
        // Send audio data
        this.socket.send(audioDataInt16.buffer);
        
        // Periodically log that we're sending audio (to avoid flooding)
        if (Math.random() < 0.005) {
          // Calculate audio energy to check if there's actual sound
          let energy = 0;
          for (let i = 0; i < audioData.length; i++) {
            energy += audioData[i] * audioData[i];
          }
          energy = energy / audioData.length;
          
          console.log("Sending audio chunk, length:", audioData.length, "Energy:", energy.toFixed(6));
        }
      } catch (err) {
        console.error("Error sending audio data:", err);
      }
    } else if (!this.socket) {
      console.error("Cannot send audio: WebSocket is null");
    } else {
      console.error("Cannot send audio: WebSocket not open, state:", this.socket ? this.socket.readyState : "null");
    }
  }

  disconnect() {
    this.isReady = false;
    if (this.socket) {
      console.log("Closing AssemblyAI WebSocket connection...");
      this.socket.close();
      this.socket = null;
    }
  }
}

// Generate responses with Gemini API
export async function generateAnswerWithGemini(
  question: string, 
  transcriptContext: string,
  resumeInfo?: any,
  jobDescription?: string,
  isUserProvidedResume?: boolean
) {
  try {
    console.log(`Requesting Gemini model: ${MODEL_NAME}`);
    // Get the generative model with optimized settings for speed
    const model = genAI.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.1, // Lower temperature for faster, more deterministic responses
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 500, // Limit output size for faster responses
      },
    });

    // Get resume details from user input or create a placeholder
    let resumeDetails = '';
    
    if (isUserProvidedResume && resumeInfo && resumeInfo.userProvidedResume) {
      // Use the user's provided resume
      resumeDetails = resumeInfo.userProvidedResume;
      console.log("Using user-provided resume");
    } else {
      // Use a minimal placeholder if no resume is provided
      resumeDetails = `
Your resume details will appear here. Please add your resume in the Key Insights tab.
`;
      console.log("No resume provided, using placeholder");
    }

    // Build the prompt based on whether job description is provided
    let promptText = `
You are in a job interview. Answer the question professionally based on your resume:

QUESTION: ${question}

`;
      
    // Add resume details if provided
    if (resumeDetails.trim()) {
      promptText += `
RESUME:
${resumeDetails}
`;
    }

    // Add job description to prompt if provided
    if (jobDescription && jobDescription.trim()) {
      promptText += `
JOB DESCRIPTION:
${jobDescription.trim()}

Based on this job description, emphasize relevant skills and experience in your answer.
`;
    }
    
    // Complete the prompt
    promptText += `
Format:
QUESTION: [extract question]
ANSWER: [concise professional answer highlighting relevant experience from your resume]

Keep it concise. Focus on highlighting your experience and achievements that are most relevant to the position.
`;
    
    // Generate content with a shorter timeout for faster feedback
    console.log("Sending prompt to Gemini...");
    const result = await Promise.race([
      model.generateContent(promptText),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini API request timed out")), 5000))
    ]);
    
    if (!result) {
      throw new Error("Failed to get response from Gemini");
    }
    
    // @ts-ignore - Working around type issues with the Promise.race
    const response = result.response;
    
    // Clean up any unwanted text that tends to repeat
    let cleanedText = response.text()
      .replace(/also helping you to save money by using resources and a frugal and responsible manner/ig, '')
      .replace(/that is a crac?\.\.\./ig, '')
      .trim();
      
    return cleanedText;
  } catch (error) {
    console.error('Error generating answer with Gemini:', error);
    
    // More specific error handling
    let errorMessage = "I couldn't generate a response at this time. Please try again.";
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('Gemini API request timed out');
        errorMessage = "The request took too long. Try with a shorter transcript.";
      } else if (error.message.includes('404') && error.message.includes('not found')) {
        console.error('Gemini API model not found error:', error.message);
        errorMessage = "The AI model is unavailable. Please try again later.";
      } else if (error.message.includes('429')) {
        console.error('Gemini API rate limit exceeded:', error.message);
        errorMessage = "The AI service is experiencing high demand. Please try again shortly.";
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('Gemini API authentication error:', error.message);
        errorMessage = "Authentication issue with the AI service. Please try again later.";
      }
    }
    
    return errorMessage;
  }
}

// Process audio from screen share
export function setupAudioProcessing(
  stream: MediaStream, 
  transcriptionService: AssemblyAIRealTimeTranscription
) {
  try {
    console.log("Setting up audio processing with sample rate 44100Hz");
    const audioContext = new AudioContext({ sampleRate: 44100 });
    const source = audioContext.createMediaStreamSource(stream);
    
    // Using smaller buffer size for more frequent updates
    const bufferSize = 2048;
    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    // Need to connect to destination for processing to work in some browsers,
    // but we use a gain node to silence the output
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Mute the output
    
    // Connect the audio processing graph
    source.connect(processor);
    processor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    console.log("Audio processing setup complete, processor connected");
    
    // Flag to track if we're currently sending data
    let isSending = false;
    // Queue for audio data to ensure we don't lose data while waiting for connection
    const audioQueue: Float32Array[] = [];
    const MAX_QUEUE_SIZE = 10; // Maximum number of buffers to queue
    
    // Function to process and send queued audio data
    const processQueue = async () => {
      if (isSending || audioQueue.length === 0) return;
      
      isSending = true;
      
      try {
        const audioData = audioQueue.shift();
        if (audioData) {
          await transcriptionService.sendAudio(audioData);
        }
      } catch (err) {
        console.error("Error processing audio queue:", err);
      } finally {
        isSending = false;
        // Process next item if there are more in the queue
        if (audioQueue.length > 0) {
          processQueue();
        }
      }
    };
    
    // Process audio data
    processor.onaudioprocess = (e) => {
      try {
        const audioData = e.inputBuffer.getChannelData(0);
        
        // Check for non-zero audio data
        let hasSound = false;
        let sum = 0;
        
        for (let i = 0; i < audioData.length; i++) {
          sum += Math.abs(audioData[i]);
          if (Math.abs(audioData[i]) > 0.01) {
            hasSound = true;
          }
        }
        
        const avgLevel = sum / audioData.length;
        
        // Only send data if it contains sound
        if (hasSound) {
          // Create a copy of the audio data since the original buffer will be reused
          const audioDataCopy = new Float32Array(audioData.length);
          audioDataCopy.set(audioData);
          
          // Add to queue, but keep queue size limited
          if (audioQueue.length < MAX_QUEUE_SIZE) {
            audioQueue.push(audioDataCopy);
          } else {
            // If queue is full, remove oldest item
            audioQueue.shift();
            audioQueue.push(audioDataCopy);
          }
          
          // Process queue if not already processing
          if (!isSending) {
            processQueue();
          }
          
          // Periodically log audio levels
          if (Math.random() < 0.01) {
            console.log("Audio level:", avgLevel, "Queue size:", audioQueue.length);
          }
        }
      } catch (err) {
        console.error("Error in audio processing:", err);
      }
    };
    
    console.log("Audio processor event handler attached");
    
    return {
      stop: () => {
        try {
          processor.disconnect();
          source.disconnect();
          gainNode.disconnect();
          audioContext.close();
          console.log("Audio processing stopped and cleaned up");
        } catch (err) {
          console.error("Error stopping audio processing:", err);
        }
      }
    };
  } catch (err) {
    console.error("Failed to set up audio processing:", err);
    return {
      stop: () => {
        console.log("No audio processing to stop");
      }
    };
  }
} 