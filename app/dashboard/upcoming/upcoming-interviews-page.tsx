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
import { Search, Calendar, Clock, Video, AlertCircle } from "lucide-react";
import { format, isPast, addMinutes, differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UpcomingInterview {
  id: string;
  title: string;
  scheduledFor: string;
  expectedDurationMinutes: number;
}

interface UpcomingInterviewsPageProps {
  interviews: UpcomingInterview[];
}

export function UpcomingInterviewsPage({ interviews }: UpcomingInterviewsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterview, setSelectedInterview] = useState<UpcomingInterview | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const router = useRouter();

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

  // Calculate end time
  const getEndTime = (startTime: string, durationMinutes: number) => {
    try {
      const start = new Date(startTime);
      const end = addMinutes(start, durationMinutes);
      return format(end, "h:mm a");
    } catch (error) {
      return "";
    }
  };

  // Get relative date description
  const getRelativeDateText = (dateString: string) => {
    try {
      const interviewDate = new Date(dateString);
      const today = new Date();
      const days = differenceInDays(interviewDate, today);

      if (days === 0) return "Today";
      if (days === 1) return "Tomorrow";
      if (days < 7) return `In ${days} days`;
      return formatDate(dateString);
    } catch (error) {
      return "Unknown";
    }
  };

  // Handle cancel interview
  const handleCancelInterview = async () => {
    if (!selectedInterview) return;

    try {
      // Call the API to cancel the interview
      const response = await fetch(`/api/interviews/${selectedInterview.id}/cancel`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel interview');
      }
      
      // Close the dialog and clear selection
      setCancelDialogOpen(false);
      setSelectedInterview(null);
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error cancelling interview:", error);
      // You could add error handling UI here
    }
  };

  // Handle start interview
  const handleStartInterview = (interview: UpcomingInterview) => {
    // Navigate to the interview page
    router.push(`/interview?id=${interview.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Upcoming Interviews</h1>
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
            <CardTitle>Total Scheduled</CardTitle>
            <CardDescription>Upcoming interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{interviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next Interview</CardTitle>
            <CardDescription>Coming up next</CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length > 0 ? (
              <div>
                <p className="text-lg font-medium">{interviews[0]?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {getRelativeDateText(interviews[0]?.scheduledFor)} at{" "}
                  {formatTime(interviews[0]?.scheduledFor)}
                </p>
              </div>
            ) : (
              <p className="text-lg font-medium">No upcoming interviews</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Schedule New</CardTitle>
            <CardDescription>Add to your calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Interview
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>
            View and manage your scheduled interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInterviews.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interview Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterviews.map((interview) => {
                  const interviewDate = new Date(interview.scheduledFor);
                  const isPastInterview = isPast(interviewDate);
                  const isToday = differenceInDays(interviewDate, new Date()) === 0;

                  return (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">
                        {interview.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatDate(interview.scheduledFor)}
                            {isToday && (
                              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatTime(interview.scheduledFor)} -{" "}
                            {getEndTime(
                              interview.scheduledFor,
                              interview.expectedDurationMinutes
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {interview.expectedDurationMinutes} minutes
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={!isToday}
                            onClick={() => handleStartInterview(interview)}
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Start
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInterview(interview);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No upcoming interviews</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Schedule an interview to see it here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
            <DialogDescription>
              {selectedInterview?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {selectedInterview && formatDate(selectedInterview.scheduledFor)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {selectedInterview && formatTime(selectedInterview.scheduledFor)} -{" "}
                  {selectedInterview &&
                    getEndTime(
                      selectedInterview.scheduledFor,
                      selectedInterview.expectedDurationMinutes
                    )}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="font-medium">Preparation Tips</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                  <li>Research the company and position</li>
                  <li>Prepare answers for common questions</li>
                  <li>Test your camera and microphone before the interview</li>
                  <li>Find a quiet place with good lighting</li>
                  <li>Have your resume and notes ready</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                setDetailsDialogOpen(false);
                setCancelDialogOpen(true);
              }}
            >
              Cancel Interview
            </Button>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this interview? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInterview}>
              Yes, cancel interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 