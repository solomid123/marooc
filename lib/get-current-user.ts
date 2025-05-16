// This is a client-side compatible version
// No more server-side imports

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  credits: number
  planName: string
}

// Modified to be a placeholder that returns mock data
// In a real app, you'd use a client-side auth solution
export async function getCurrentUser(): Promise<User | null> {
  console.log("getCurrentUser function called (client-side version)")
  
  // For development/preview purposes, we'll just return null
  // The layout will use MOCK_USER instead
  return null
}
