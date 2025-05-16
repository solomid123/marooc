import { UpcomingInterviewsPage } from "./upcoming-interviews-page";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MOCK_DB } from "@/lib/mock-data";

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";

export default async function UpcomingPage() {
  // In development mode, use mock data
  if (isPreview) {
    console.log("Upcoming interviews page: Development mode detected, using mock data");
    
    // Get mock upcoming interviews
    const mockUpcomingInterviews = MOCK_DB.interviews.filter(
      interview => interview.status === "scheduled"
    ).map(interview => ({
      id: interview.id,
      title: interview.title,
      scheduledFor: interview.scheduled_for,
      expectedDurationMinutes: interview.expected_duration_minutes
    }));
    
    return <UpcomingInterviewsPage interviews={mockUpcomingInterviews} />;
  }

  // Production mode - use real data
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  const supabase = createClient();
  
  // Fetch upcoming interviews
  const { data: interviews, error } = await supabase
    .from("interviews")
    .select("id, title, scheduled_for, expected_duration_minutes")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .gt("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true });
  
  if (error) {
    console.error("Error fetching upcoming interviews:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Upcoming Interviews</h1>
        <p className="text-red-500">Failed to load upcoming interviews. Please try again later.</p>
      </div>
    );
  }
  
  const formattedInterviews = interviews.map(interview => ({
    id: interview.id,
    title: interview.title,
    scheduledFor: interview.scheduled_for,
    expectedDurationMinutes: interview.expected_duration_minutes
  }));
  
  return <UpcomingInterviewsPage interviews={formattedInterviews} />;
} 