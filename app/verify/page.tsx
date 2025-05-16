"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { CheckCircle, XCircle } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    async function verifyEmail() {
      try {
        // Get the token from the URL
        const token = searchParams.get("token")
        const type = searchParams.get("type")

        if (!token || type !== "email_verification") {
          setVerificationStatus('error')
          setErrorMessage("Invalid verification link. Please check your email and try again.")
          return
        }

        // Verify the email with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email",
        })

        if (error) {
          console.error("Verification error:", error)
          setVerificationStatus('error')
          setErrorMessage(error.message || "Failed to verify your email. The link may have expired.")
        } else {
          setVerificationStatus('success')
          // Wait a moment before redirecting to login
          setTimeout(() => {
            router.push("/login?verified=true")
          }, 3000)
        }
      } catch (error) {
        console.error("Unexpected verification error:", error)
        setVerificationStatus('error')
        setErrorMessage("An unexpected error occurred. Please try again later.")
      }
    }

    verifyEmail()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        {verificationStatus === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h1 className="text-2xl font-bold">Verifying your email...</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address.</p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Email verified!</h1>
            <p className="text-muted-foreground">
              Your email has been successfully verified. You will be redirected to the login page shortly.
            </p>
            <Button asChild className="mt-4">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="pt-4 space-y-2">
              <Button asChild variant="outline">
                <Link href="/signup">Sign Up Again</Link>
              </Button>
              <div className="mt-2">
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 