import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Code, Mic, Globe, FileText } from "lucide-react"
import { HeroSection } from "@/components/hero-section"
import { FeatureCard } from "@/components/feature-card"
import { PricingSection } from "@/components/pricing-section"
import { TestimonialSection } from "@/components/testimonial-section"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-block font-bold">Markhor</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              <Link
                href="#features"
                className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Pricing
              </Link>
              <Link
                href="#testimonials"
                className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Testimonials
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <HeroSection />

        <section id="features" className="container py-12 md:py-24 lg:py-32">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Features</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Markhor provides powerful AI assistance during your interviews
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 mt-16 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Mic className="h-10 w-10 text-primary" />}
              title="Real-time Assistance"
              description="Get instant AI-generated answers to interview questions as they're asked"
            />
            <FeatureCard
              icon={<Code className="h-10 w-10 text-primary" />}
              title="Coding Interview Support"
              description="Receive help with technical questions and coding challenges during interviews"
            />
            <FeatureCard
              icon={<Globe className="h-10 w-10 text-primary" />}
              title="Multilingual Support"
              description="Use Markhor in 50+ languages for interviews around the world"
            />
            <FeatureCard
              icon={<FileText className="h-10 w-10 text-primary" />}
              title="Resume Integration"
              description="Upload your resume for personalized answers tailored to your experience"
            />
            <FeatureCard
              icon={<ArrowRight className="h-10 w-10 text-primary" />}
              title="Seamless Integration"
              description="Works with Zoom, Google Meet, and Microsoft Teams without detection"
            />
            <FeatureCard
              icon={<Mic className="h-10 w-10 text-primary" />}
              title="Post-Interview Analysis"
              description="Get AI-powered feedback and improvement suggestions after each interview"
            />
          </div>
        </section>

        <PricingSection />

        <TestimonialSection />
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 Markhor. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
