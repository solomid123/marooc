# Markhor Interview Assistant

A powerful AI-powered interview preparation and assistance tool built with Next.js, Tailwind CSS, and Google's Gemini API.

## Features

### Resume Analysis
- Upload your resume or CV (PDF, DOC, or text)
- AI-powered analysis extracts key skills, experience, and education
- Personalized interview tips based on your resume content

### Interview Preparation
- Practice with mock interviews
- Get real-time AI-generated suggestions for answers
- Customized for different interview types (technical, behavioral, etc.)

### Real-Time Interview Assistance
- Connect to your actual interview video call
- Live transcription of the conversation
- Instant AI-generated suggestions for answers
- Key insights and analysis during the interview

### Interview History & Analysis
- Review past interviews
- Track progress and improvement
- Get feedback on your performance

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **API Integration**: 
  - Google Gemini API for resume analysis and answer generation
  - AssemblyAI for real-time speech transcription
- **Authentication**: Custom authentication system

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/markhor-interview-assistant.git
cd markhor-interview-assistant
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Create a `.env.local` file with your API keys
```
GEMINI_API_KEY=your_gemini_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key 
```

4. Start the development server
```bash
npm run dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Flow

1. **Upload Resume**: Upload or enter your resume information for AI analysis
2. **Configure Interview**: Enter details about the job and position you're interviewing for
3. **Connect to Interview**: Allow microphone access and select the meeting window
4. **Get Real-Time Assistance**: Receive transcription and AI-generated answer suggestions
5. **Review and Save**: Save interview transcript and feedback for later review

## Architecture

The application uses a client-side approach for the UI with server components for data fetching. The real-time transcription uses WebSockets to stream audio to the AssemblyAI API. The Gemini API is used for resume analysis and generating contextual responses based on the interview transcription.

## API Recommendations

For real-time transcription, we recommend:

1. **AssemblyAI** - $0.00042 per second ($1.50 per hour)
2. **Google Speech-to-Text** - $0.016 per minute ($0.96 per hour)
3. **Amazon Transcribe** - $0.024 per minute ($1.44 per hour)

See `docs/transcription-api-recommendations.md` for detailed information on integration.

## License

MIT 