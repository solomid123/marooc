"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function UpcomingInterviews() {
  const router = useRouter()
  
  const handlePrepareNow = () => {
    router.push("/interview")
  }
  
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Frontend Developer at TechCorp</CardTitle>
              <CardDescription>Technical Interview</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8">
              <CalendarDays className="mr-2 h-4 w-4" />
              Add to Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tomorrow, 2:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Zoom</span>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium">Interview Preparation Notes:</h4>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li>• Review React hooks and state management</li>
              <li>• Prepare for algorithm questions (sorting, searching)</li>
              <li>• Research company's recent projects</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Edit Details</Button>
          <Button onClick={handlePrepareNow}>Prepare Now</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Product Manager at InnovateCo</CardTitle>
              <CardDescription>Behavioral Interview</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-8">
              <CalendarDays className="mr-2 h-4 w-4" />
              Add to Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Friday, 11:00 AM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm">Google Meet</span>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium">Interview Preparation Notes:</h4>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li>• Prepare STAR method responses</li>
              <li>• Review product management frameworks</li>
              <li>• Research company's product strategy</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Edit Details</Button>
          <Button onClick={handlePrepareNow}>Prepare Now</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
