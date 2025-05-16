import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kkilgmjqeaophlglbojs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtraWxnbWpxZWFvcGhsZ2xib2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzQyNTMsImV4cCI6MjA2MjkxMDI1M30.zGqGIKI5k-g7Dg0u0GiBmw-zDxWBJcZ_yFCr6cc5PS0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get user session from client
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
} 