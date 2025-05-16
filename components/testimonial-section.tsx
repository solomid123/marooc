import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function TestimonialSection() {
  return (
    <section id="testimonials" className="container py-12 md:py-24 lg:py-32">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Success Stories</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          See how Markhor has helped candidates land their dream jobs
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 mt-16 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar>
              <AvatarImage alt="Avatar" src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-sm text-muted-foreground">Software Engineer</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              "Markhor helped me ace my technical interview at a FAANG company. The real-time coding assistance was a
              game-changer during the algorithm questions."
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar>
              <AvatarImage alt="Avatar" src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium">Jane Smith</p>
              <p className="text-sm text-muted-foreground">Product Manager</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              "I was nervous about my panel interview, but with Markhor's help, I was able to provide structured,
              thoughtful answers to complex questions. I got the job!"
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar>
              <AvatarImage alt="Avatar" src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>RJ</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium">Robert Johnson</p>
              <p className="text-sm text-muted-foreground">Data Scientist</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              "The multilingual support was incredible. I had an interview with a company in Japan, and Markhor helped
              me communicate effectively despite the language barrier."
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
