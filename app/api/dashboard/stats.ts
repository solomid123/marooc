import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { MOCK_DB } from "@/lib/mock-data";

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";

export async function GET() {
  try {
    // In development mode, use mock data
    if (isPreview) {
      console.log("Dashboard stats API: Using mock data");
      
      // Get mock user
      const mockUser = MOCK_DB.users[0];
      
      // Get mock completed interviews
      const mockCompletedInterviews = MOCK_DB.interviews.filter(
        interview => interview.status === "completed"
      );
      
      // Get mock interviews from last week
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      const mockLastWeekInterviews = mockCompletedInterviews.filter(
        interview => {
          // Type assertion to handle potentially undefined completed_at
          const completedAt = interview.completed_at as string;
          return new Date(completedAt) >= lastWeekDate;
        }
      );
      
      // Get mock technical questions
      const mockTechnicalQuestions = MOCK_DB.interview_questions.filter(
        question => question.type === "technical" && question.status === "answered"
      );
      
      // Get mock upcoming interviews
      const mockUpcomingInterviews = MOCK_DB.interviews.filter(
        interview => {
          if (interview.status === "scheduled") {
            // Type assertion to handle potentially undefined scheduled_for
            const scheduledFor = interview.scheduled_for as string;
            return new Date(scheduledFor) > new Date();
          }
          return false;
        }
      );
      
      // Sort upcoming interviews by date
      mockUpcomingInterviews.sort((a, b) => {
        // Type assertions to handle potentially undefined scheduled_for
        const dateA = new Date(a.scheduled_for as string).getTime();
        const dateB = new Date(b.scheduled_for as string).getTime();
        return dateA - dateB;
      });
      
      // Format the next interview date if available
      let nextInterviewText = "No upcoming interviews";
      if (mockUpcomingInterviews.length > 0) {
        // Type assertion to handle potentially undefined scheduled_for
        const scheduledFor = mockUpcomingInterviews[0].scheduled_for as string;
        const nextDate = new Date(scheduledFor);
        nextInterviewText = nextDate.toLocaleString('en-US', {
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      
      // Return mock stats
      return NextResponse.json({
        credits: mockUser.credits || 0,
        planName: mockUser.plan_name || "Free",
        interviewsCompleted: mockCompletedInterviews.length,
        lastWeekInterviews: mockLastWeekInterviews.length,
        technicalQuestions: mockTechnicalQuestions.length,
        upcomingInterviews: mockUpcomingInterviews.length,
        nextInterview: nextInterviewText
      });
    }
    
    // Production mode - use real data
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const supabase = createClient();
    
    // Fetch user credits from the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credits, plan_name")
      .eq("id", user.id)
      .single();
    
    if (userError) {
      console.error("Error fetching user data:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }
    
    // Fetch completed interviews count
    const { count: interviewsCompleted, error: interviewsError } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed");
    
    if (interviewsError) {
      console.error("Error fetching interviews:", interviewsError);
      return NextResponse.json(
        { error: "Failed to fetch interviews data" },
        { status: 500 }
      );
    }
    
    // Fetch interviews from last week for the delta
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    
    const { count: lastWeekInterviews, error: lastWeekError } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", lastWeekDate.toISOString());
    
    if (lastWeekError) {
      console.error("Error fetching last week interviews:", lastWeekError);
      return NextResponse.json(
        { error: "Failed to fetch last week interviews" },
        { status: 500 }
      );
    }
    
    // Fetch technical questions answered
    const { count: technicalQuestions, error: questionsError } = await supabase
      .from("interview_questions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "technical")
      .eq("status", "answered");
    
    if (questionsError) {
      console.error("Error fetching technical questions:", questionsError);
      return NextResponse.json(
        { error: "Failed to fetch technical questions" },
        { status: 500 }
      );
    }
    
    // Fetch upcoming interviews
    const { data: upcomingInterviews, error: upcomingError } = await supabase
      .from("interviews")
      .select("scheduled_for")
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .gt("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(1);
    
    if (upcomingError) {
      console.error("Error fetching upcoming interviews:", upcomingError);
      return NextResponse.json(
        { error: "Failed to fetch upcoming interviews" },
        { status: 500 }
      );
    }
    
    // Count total upcoming interviews
    const { count: upcomingCount, error: upcomingCountError } = await supabase
      .from("interviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "scheduled")
      .gt("scheduled_for", new Date().toISOString());
    
    if (upcomingCountError) {
      console.error("Error counting upcoming interviews:", upcomingCountError);
      return NextResponse.json(
        { error: "Failed to count upcoming interviews" },
        { status: 500 }
      );
    }
    
    // Format the next interview date if available
    let nextInterviewText = "No upcoming interviews";
    if (upcomingInterviews && upcomingInterviews.length > 0) {
      // Type assertion for scheduled_for
      const scheduledFor = upcomingInterviews[0].scheduled_for as string;
      const nextDate = new Date(scheduledFor);
      nextInterviewText = nextDate.toLocaleString('en-US', {
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    
    return NextResponse.json({
      credits: userData.credits || 0,
      planName: userData.plan_name || "Free",
      interviewsCompleted: interviewsCompleted || 0,
      lastWeekInterviews: lastWeekInterviews || 0,
      technicalQuestions: technicalQuestions || 0,
      upcomingInterviews: upcomingCount || 0,
      nextInterview: nextInterviewText
    });
    
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 