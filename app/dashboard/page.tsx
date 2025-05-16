// Server Component
import { getCurrentUser } from "@/lib/get-current-user"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"
import { MOCK_USER } from "@/lib/mock-data"

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"

export default async function DashboardPage() {
  // In development mode, always use mock user
  if (isPreview) {
    console.log("Dashboard page: Development mode detected, using mock user")
    
    return (
      <DashboardClient
        user={{
          firstName: MOCK_USER.firstName,
          credits: MOCK_USER.credits,
          planName: MOCK_USER.planName || "Pro"
        }}
      />
    )
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardClient
      user={{
        firstName: user.firstName,
        credits: user.credits,
        planName: user.planName || "Free"
      }}
    />
  )
}
