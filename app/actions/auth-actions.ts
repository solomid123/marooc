"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabase } from "@/lib/supabase"

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"
console.log("Auth actions initialized. Preview environment:", isPreview, "NODE_ENV:", process.env.NODE_ENV)

// Get the Supabase project ID from the URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkilgmjqeaophlglbojs.supabase.co'
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'kkilgmjqeaophlglbojs'

// Cookie names with project ID
const AUTH_COOKIE_NAME = `sb-${projectId}-auth-token`
const REFRESH_COOKIE_NAME = `sb-${projectId}-refresh-token`

console.log("Using cookie names:", AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME)

export type AuthResult = {
  success: boolean
  message: string
  userId?: string
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  console.log("SignUp function called")
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("first-name") as string
  const lastName = formData.get("last-name") as string
  const planId = Number.parseInt(formData.get("plan") as string)

  if (!email || !password || !firstName || !lastName || !planId) {
    console.log("SignUp validation failed: missing required fields")
    return { success: false, message: "All fields are required" }
  }

  try {
    // Sign up with Supabase Auth
    console.log("Calling Supabase auth.signUp")
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          plan_id: planId,
        },
      },
    })

    if (error) {
      console.error("SignUp error from Supabase:", error)
      return { success: false, message: error.message }
    }

    console.log("SignUp response from Supabase:", data ? "Success" : "No data")

    // If email confirmation is enabled, inform the user
    if (!data.session) {
      console.log("No session in response, email confirmation may be required")
      return { 
        success: true, 
        message: "Please check your email to confirm your account", 
        userId: data.user?.id 
      }
    }

    // After successful signup, store the session in a cookie
    const { session } = data
    console.log("Session received from Supabase, setting cookies")
    
    // Set cookie with the session
    console.log("Getting cookie store")
    const cookieStore = await cookies()
    console.log(`Setting auth token cookie: ${AUTH_COOKIE_NAME}`)
    cookieStore.set(AUTH_COOKIE_NAME, session?.access_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: session?.expires_in || 3600,
      path: '/',
    })
    
    // Also store the refresh token
    console.log(`Setting refresh token cookie: ${REFRESH_COOKIE_NAME}`)
    cookieStore.set(REFRESH_COOKIE_NAME, session?.refresh_token || '', {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      path: '/',
    })

    // Insert the plan data into the Supabase database
    console.log("Inserting user plan data")
    const { error: planError } = await supabase
      .from('user_plans')
      .insert([
        { 
          user_id: data.user?.id,
          plan_id: planId,
        }
      ])

    if (planError) {
      console.error("Error saving plan data:", planError)
    } else {
      console.log("User plan data saved successfully")
    }

    console.log("SignUp completed successfully")
    return { success: true, message: "Account created successfully", userId: data.user?.id }
  } catch (error) {
    console.error("Signup error:", error)
    return { success: false, message: "An error occurred during signup" }
  }
}

export async function login(formData: FormData): Promise<AuthResult> {
  console.log("Login function called")
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    console.log("Login validation failed: missing email or password")
    return { success: false, message: "Email and password are required" }
  }

  try {
    // Sign in with Supabase Auth
    console.log("Calling Supabase auth.signInWithPassword")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error from Supabase:", error)
      return { success: false, message: error.message }
    }

    console.log("Login response from Supabase:", data ? "Success" : "No data")
    const { session } = data
    
    // Set cookie with the session
    console.log("Getting cookie store")
    const cookieStore = await cookies()
    console.log(`Setting auth token cookie: ${AUTH_COOKIE_NAME}`)
    cookieStore.set(AUTH_COOKIE_NAME, session?.access_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: session?.expires_in || 3600,
      path: '/',
    })
    
    // Also store the refresh token
    console.log(`Setting refresh token cookie: ${REFRESH_COOKIE_NAME}`)
    cookieStore.set(REFRESH_COOKIE_NAME, session?.refresh_token || '', {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      path: '/',
    })

    console.log("Login completed successfully, returning result")
    return { success: true, message: "Login successful", userId: session?.user.id }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "An error occurred during login" }
  }
}

// This function is meant to be called directly from a server component or middleware
export async function logout() {
  console.log("Logout function called")
  // Get the auth token from cookies
  console.log("Getting cookie store")
  const cookieStore = await cookies()
  const authToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  console.log("Auth token exists:", !!authToken)
  
  if (authToken) {
    try {
      // Sign out from Supabase
      console.log("Calling Supabase auth.signOut")
      await supabase.auth.signOut()
      console.log("Supabase signOut completed")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Clear the auth cookies
  console.log(`Deleting auth cookies: ${AUTH_COOKIE_NAME}, ${REFRESH_COOKIE_NAME}`)
  cookieStore.delete(AUTH_COOKIE_NAME)
  cookieStore.delete(REFRESH_COOKIE_NAME)

  // Redirect to home page
  console.log("Redirecting to home page")
  redirect("/")
}
