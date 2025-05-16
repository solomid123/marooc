import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, ThumbsUp, Download } from "lucide-react"

export function InterviewHistory() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Data Scientist at AnalyticsPro</CardTitle>
              <CardDescription>Technical Interview</CardDescription>
            </div>
            <Badge>Completed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Performance Score: 85%</span>
            </div>
            <div className="text-sm text-muted-foreground">April 15, 2025</div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">AI Feedback Summary:</h4>
            <p className="text-sm text-muted-foreground">
              Strong technical knowledge demonstrated in machine learning concepts. Good communication of complex ideas.
              Areas for improvement: SQL query optimization and time series forecasting techniques.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Full Analysis
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Transcript
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Software Engineer at DevCorp</CardTitle>
              <CardDescription>Behavioral Interview</CardDescription>
            </div>
            <Badge>Completed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Performance Score: 92%</span>
            </div>
            <div className="text-sm text-muted-foreground">April 10, 2025</div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">AI Feedback Summary:</h4>
            <p className="text-sm text-muted-foreground">
              Excellent communication of past experiences using the STAR method. Strong examples of teamwork and
              problem-solving. Consider adding more quantifiable results to your achievements in future interviews.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Full Analysis
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Transcript
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>UX Designer at CreativeTech</CardTitle>
              <CardDescription>Portfolio Review</CardDescription>
            </div>
            <Badge>Completed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Performance Score: 88%</span>
            </div>
            <div className="text-sm text-muted-foreground">April 5, 2025</div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">AI Feedback Summary:</h4>
            <p className="text-sm text-muted-foreground">
              Strong presentation of design process and user research methods. Portfolio examples were well explained.
              Consider focusing more on business impact of design decisions in future interviews.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Full Analysis
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Transcript
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
