import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"
console.log("Middleware initialized. Preview environment:", isPreview, "NODE_ENV:", process.env.NODE_ENV)

// Get the Supabase project ID from the URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kkilgmjqeaophlglbojs.supabase.co'
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'kkilgmjqeaophlglbojs'

// Cookie name with project ID
const AUTH_COOKIE_NAME = `sb-${projectId}-auth-token`
console.log("Middleware using auth cookie name:", AUTH_COOKIE_NAME)

export function middleware(request: NextRequest) {
  console.log("Middleware called for path:", request.nextUrl.pathname)
  
  // In preview/development mode, allow all access without redirects
  // IMPORTANT: This is for development convenience only and should not be relied on in production
  if (isPreview) {
    console.log("DEVELOPMENT MODE: Bypassing authentication checks")
    return NextResponse.next()
  }
  
  // Redirect old routes to new auth routes
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
  
  if (request.nextUrl.pathname === "/signup") {
    return NextResponse.redirect(new URL("/auth/signup", request.url))
  }
  
  if (request.nextUrl.pathname === "/forgot-password") {
    return NextResponse.redirect(new URL("/auth/forgot-password", request.url))
  }
  
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  console.log("Auth token exists:", !!authToken)
  
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth/") || 
                     request.nextUrl.pathname.startsWith("/verify")
  console.log("Is auth page:", isAuthPage)

  // Allow access to the test page without authentication
  if (request.nextUrl.pathname === "/dashboard/test-page") {
    console.log("Allowing access to test page without authentication")
    return NextResponse.next()
  }

  // If accessing dashboard without a session, redirect to login
  if (request.nextUrl.pathname.startsWith("/dashboard") && !authToken) {
    console.log("Accessing dashboard without auth token, redirecting to login")
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
  
  // If accessing interview page without a session, redirect to login
  if (request.nextUrl.pathname.startsWith("/interview") && !authToken) {
    console.log("Accessing interview without auth token, redirecting to login")
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // If accessing auth pages with a valid session, redirect to dashboard
  // Exception: Don't redirect from verification or password reset pages even with valid token
  if (isAuthPage && authToken && 
      !request.nextUrl.pathname.startsWith("/verify") && 
      !request.nextUrl.pathname.startsWith("/auth/reset-password")) {
    console.log("Accessing auth page with valid token, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  console.log("No redirection needed, proceeding with request")
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interview/:path*",
    "/login",
    "/signup",
    "/verify",
    "/forgot-password",
    "/auth/:path*"
  ],
}
