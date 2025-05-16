import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function PricingSection() {
  return (
    <section id="pricing" className="container py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Simple, Transparent Pricing</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Pay once, use when you need it. No subscriptions.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 mt-16 md:grid-cols-2 lg:grid-cols-3 xl:max-w-6xl xl:mx-auto">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Starter</CardTitle>
            <CardDescription>Perfect for your upcoming interview</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-bold">
              $29
              <span className="ml-1 text-lg font-medium text-muted-foreground">one-time</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>3 hours of interview assistance</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Real-time AI answers</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Basic coding interview support</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Resume upload</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/signup?plan=starter" className="w-full">
              <Button size="lg" className="w-full">
                Get Started
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="flex flex-col border-primary">
          <CardHeader>
            <div className="px-4 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-full w-fit mb-2">
              MOST POPULAR
            </div>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For serious job seekers</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-bold">
              $49
              <span className="ml-1 text-lg font-medium text-muted-foreground">one-time</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>8 hours of interview assistance</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Advanced AI answers</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Full coding interview support</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Resume analysis & integration</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Post-interview feedback</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/signup?plan=pro" className="w-full">
              <Button size="lg" className="w-full">
                Get Started
              </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
            <CardDescription>For teams and organizations</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-bold">
              $99
              <span className="ml-1 text-lg font-medium text-muted-foreground">one-time</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>20 hours of interview assistance</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Premium AI answers</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Advanced coding interview support</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Resume & portfolio integration</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Comprehensive post-interview analysis</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span>Priority support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/signup?plan=enterprise" className="w-full">
              <Button size="lg" className="w-full">
                Get Started
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}
