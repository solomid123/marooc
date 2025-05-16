"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { CheckCircle, AlertCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if we have a valid token in the URL
    const hasToken = searchParams.has("token") || searchParams.has("access_token")
    setValidToken(hasToken)
    
    if (!hasToken) {
      setError("Invalid or missing reset token. Please request a new password reset link.")
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    try {
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error("Password update error:", error)
        setError(error.message)
      } else {
        // Success - show success message and redirect after delay
        setSuccess(true)
        setTimeout(() => {
          router.push("/login?reset=success")
        }, 3000)
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Reset your password</h1>
            <p className="text-muted-foreground">
              Enter a new password for your account.
            </p>
          </div>

          {validToken === false && (
            <div className="space-y-6">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Invalid or expired reset link. Please request a new password reset.
                </AlertDescription>
              </Alert>
              <div className="text-center">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/forgot-password">Request new reset link</Link>
                </Button>
              </div>
            </div>
          )}
          
          {success ? (
            <div className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <AlertDescription className="text-green-700">
                  Your password has been successfully reset. You will be redirected to the login page.
                </AlertDescription>
              </Alert>
              <div className="text-center">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Go to login</Link>
                </Button>
              </div>
            </div>
          ) : validToken && (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Reset Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 