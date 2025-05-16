import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const interviewId = params.id;
    
    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // First, verify that the interview belongs to the current user
    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("id, status")
      .eq("id", interviewId)
      .eq("user_id", user.id)
      .single();
    
    if (fetchError || !interview) {
      console.error("Error fetching interview:", fetchError);
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }
    
    if (interview.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed interview" },
        { status: 400 }
      );
    }
    
    if (interview.status === "cancelled") {
      return NextResponse.json(
        { message: "Interview already cancelled" },
        { status: 200 }
      );
    }
    
    // Update the interview status to cancelled
    const { error: updateError } = await supabase
      .from("interviews")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", interviewId);
    
    if (updateError) {
      console.error("Error cancelling interview:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel interview" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "Interview cancelled successfully" },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error in cancel interview API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 