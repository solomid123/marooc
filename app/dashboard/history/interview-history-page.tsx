"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

interface Interview {
  id: string;
  title: string;
  completedAt: string;
  durationMinutes: number;
  feedback: string | null;
}

interface InterviewHistoryPageProps {
  interviews: Interview[];
}

export function InterviewHistoryPage({ interviews }: InterviewHistoryPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  // Filter interviews based on search query
  const filteredInterviews = interviews.filter((interview) =>
    interview.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (error) {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Interview History</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search interviews..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Interviews</CardTitle>
            <CardDescription>Completed interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{interviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Duration</CardTitle>
            <CardDescription>Time spent interviewing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.floor(
                interviews.reduce(
                  (total, interview) => total + (interview.durationMinutes || 0),
                  0
                ) / 60
              )}{" "}
              hours{" "}
              {interviews
                .reduce(
                  (total, interview) => total + (interview.durationMinutes || 0),
                  0
                ) % 60}{" "}
              mins
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest Interview</CardTitle>
            <CardDescription>Most recent session</CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length > 0 ? (
              <p className="text-lg font-medium">
                {interviews[0]?.title || "No interviews yet"}
              </p>
            ) : (
              <p className="text-lg font-medium">No interviews yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Sessions</CardTitle>
          <CardDescription>
            View and manage your past interview sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInterviews.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interview Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">
                      {interview.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(interview.completedAt)}
                        <span className="mx-1">•</span>
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatTime(interview.completedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {interview.durationMinutes} minutes
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInterview(interview)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Feedback
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No interviews found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Complete an interview to see it here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInterview && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Feedback</CardTitle>
            <CardDescription>{selectedInterview.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Date & Time</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedInterview.completedAt)} at{" "}
                  {formatTime(selectedInterview.completedAt)}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Duration</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedInterview.durationMinutes} minutes
                </p>
              </div>
              <div>
                <h3 className="font-medium">Feedback</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {selectedInterview.feedback || "No feedback provided"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedInterview(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 