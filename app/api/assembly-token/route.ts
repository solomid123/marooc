import { NextResponse } from 'next/server';

// Use the AssemblyAI API key from the environment 
// For development, we're using the hardcoded key from lib/api-services.ts
const ASSEMBLY_AI_API_KEY = 'cdd03ced259e446a962fea897841d6d1';

export async function POST() {
  try {
    console.log('Server: Requesting AssemblyAI token');
    
    // Make the request to AssemblyAI from the server
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ASSEMBLY_AI_API_KEY
      },
      body: JSON.stringify({
        expires_in: 3600 // 1 hour
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server: AssemblyAI token request failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to get token: ${response.status}` }, 
        { status: response.status }
      );
    }

    // Get the token from the response
    const data = await response.json();
    console.log('Server: Successfully obtained AssemblyAI token');
    
    // Return the token to the client
    return NextResponse.json(data);
  } catch (error) {
    console.error('Server: Error in AssemblyAI token request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 