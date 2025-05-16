"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signUp } from "@/app/actions/auth-actions"

type Plan = {
  id: number
  name: string
  price: number
  description: string
  credits: number
}

// Default plans to use as fallback
const DEFAULT_PLANS = [
  { id: 1, name: "Starter", price: 29, description: "Perfect for your upcoming interview", credits: 180 },
  { id: 2, name: "Pro", price: 49, description: "For serious job seekers", credits: 480 },
  { id: 3, name: "Enterprise", price: 99, description: "For teams and organizations", credits: 1200 },
]

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS)
  const [selectedPlan, setSelectedPlan] = useState<string>("1")
  const [apiError, setApiError] = useState<string | null>(null)
  const [verificationRequired, setVerificationRequired] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState("")

  useEffect(() => {
    // Get the plan from URL if provided
    const planFromUrl = searchParams.get("plan")
    if (planFromUrl) {
      switch (planFromUrl) {
        case "starter":
          setSelectedPlan("1")
          break
        case "pro":
          setSelectedPlan("2")
          break
        case "enterprise":
          setSelectedPlan("3")
          break
      }
    }

    // Fetch plans from the database
    async function fetchPlans() {
      try {
        const response = await fetch("/api/plans")
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json()
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans)
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err)
        setApiError("Could not load plans from the server. Using default plans.")
        // Already using default plans as initial state
      }
    }

    fetchPlans()
  }, [searchParams])

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      const email = formData.get("email") as string
      const result = await signUp(formData)

      if (result.success) {
        if (result.message.includes("check your email")) {
          // Email verification required
          setVerificationRequired(true)
          setVerificationEmail(email)
        } else {
          // No email verification required, go to dashboard
          router.push("/dashboard")
          router.refresh()
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Signup error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (verificationRequired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="text-muted-foreground">
              We've sent a verification link to <strong>{verificationEmail}</strong>
            </p>
            <p className="text-muted-foreground mt-2">
              Please check your inbox and click the verification link to complete your registration.
            </p>
          </div>
          <div className="pt-4">
            <Button variant="outline" asChild className="mx-auto">
              <Link href="/login">Return to login</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-muted-foreground">Enter your information to get started</p>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {apiError && (
            <Alert>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" name="first-name" placeholder="John" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" name="last-name" placeholder="Doe" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label>Select a plan</Label>
              <RadioGroup defaultValue={selectedPlan} name="plan">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`flex items-center space-x-2 border rounded-md p-3 ${
                      plan.id === 2 ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <RadioGroupItem value={plan.id.toString()} id={`plan-${plan.id}`} />
                    <Label htmlFor={`plan-${plan.id}`} className="flex-1">
                      {plan.name} - ${plan.price}
                    </Label>
                    {plan.id === 2 && (
                      <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
