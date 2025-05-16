import { InterviewHistoryPage } from "./interview-history-page";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MOCK_DB } from "@/lib/mock-data";

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";

export default async function HistoryPage() {
  // In development mode, use mock data
  if (isPreview) {
    console.log("History page: Development mode detected, using mock data");
    
    // Get mock completed interviews
    const mockCompletedInterviews = MOCK_DB.interviews.filter(
      interview => interview.status === "completed"
    ).map(interview => ({
      id: interview.id,
      title: interview.title,
      completedAt: interview.completed_at,
      durationMinutes: interview.duration_minutes,
      feedback: interview.feedback
    }));
    
    return <InterviewHistoryPage interviews={mockCompletedInterviews} />;
  }

  // Production mode - use real data
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  const supabase = createClient();
  
  // Fetch completed interviews
  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("id, title, completed_at, duration_minutes, feedback")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching interview history:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Interview History</h1>
        <p className="text-red-500">Failed to load interview history. Please try again later.</p>
      </div>
    );
  }
  
  const formattedInterviews = interviews.map(interview => ({
    id: interview.id,
    title: interview.title,
    completedAt: interview.completed_at,
    durationMinutes: interview.duration_minutes,
    feedback: interview.feedback
  }));
  
  return <InterviewHistoryPage interviews={formattedInterviews} />;
} 