import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Your AI Interview Assistant
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Get real-time AI-powered answers during your job interviews. Boost your confidence and land your dream
                job.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/signup">
                <Button size="lg" className="w-full">
                  Get Started
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full h-[350px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden border bg-muted/50 p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">Interview in progress</div>
                </div>
                <div className="flex-1 bg-background/80 backdrop-blur-sm rounded-md p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium">Interviewer:</p>
                      <p className="text-sm">
                        Can you tell me about a challenging project you worked on and how you overcame obstacles?
                      </p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-md">
                      <p className="text-sm font-medium text-primary">Markhor AI Suggestion:</p>
                      <p className="text-sm">
                        In my previous role at XYZ Corp, I led a team that was tasked with migrating our legacy system
                        to a modern cloud architecture. The main challenges included maintaining data integrity,
                        ensuring zero downtime, and training team members on the new technology. I approached this by
                        creating a phased migration plan, implementing comprehensive testing protocols, and organizing
                        regular knowledge-sharing sessions. Despite initial setbacks with data synchronization, we
                        successfully completed the migration two weeks ahead of schedule, resulting in a 40% improvement
                        in system performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
