import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentUser } from "@/lib/get-current-user"
import { redirect } from "next/navigation"
import { MOCK_USER } from "@/lib/mock-data"

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"

export default async function SettingsPage() {
  // In development mode, always use mock user
  if (isPreview) {
    console.log("Settings page: Development mode detected, using mock user")
    return renderSettingsPage(MOCK_USER)
  }
  
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return renderSettingsPage(user)
}

function renderSettingsPage(user: any) {
  return (
    <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr] py-8">
      <aside className="hidden w-[200px] flex-col md:flex lg:w-[250px]">
        <nav className="grid items-start gap-2">
          <a
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            <span className="h-4 w-4" />
            Dashboard
          </a>
          <a
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary"
          >
            <span className="h-4 w-4" />
            Settings
          </a>
        </nav>
      </aside>
      <main className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" defaultValue={user.firstName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" defaultValue={user.lastName} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Update Password</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{user.planName} Plan</h3>
                    <p className="text-sm text-muted-foreground">{user.credits.toFixed(1)} hours remaining</p>
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-destructive/50 p-4">
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Once you delete your account, there is no going back. This action is not reversible.
                </p>
                <Button variant="destructive" className="mt-4">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
