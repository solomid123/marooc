import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const resumeData = await request.json();
    
    if (!resumeData) {
      return NextResponse.json(
        { error: "No resume data provided" },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!resumeData.name || !resumeData.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Check if user already has a resume
    const { data: existingResume, error: fetchError } = await supabase
      .from("user_resumes")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    let result;
    
    if (existingResume) {
      // Update existing resume
      const { data, error } = await supabase
        .from("user_resumes")
        .update({
          name: resumeData.name,
          email: resumeData.email,
          phone: resumeData.phone || null,
          summary: resumeData.summary || null,
          skills: resumeData.skills || [],
          experience: resumeData.experience || [],
          education: resumeData.education || [],
          file_name: resumeData.fileName || null,
          file_type: resumeData.fileType || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingResume.id)
        .select();
      
      if (error) {
        console.error("Error updating resume:", error);
        return NextResponse.json(
          { error: "Failed to update resume" },
          { status: 500 }
        );
      }
      
      result = data[0];
    } else {
      // Insert new resume
      const { data, error } = await supabase
        .from("user_resumes")
        .insert({
          user_id: user.id,
          name: resumeData.name,
          email: resumeData.email,
          phone: resumeData.phone || null,
          summary: resumeData.summary || null,
          skills: resumeData.skills || [],
          experience: resumeData.experience || [],
          education: resumeData.education || [],
          file_name: resumeData.fileName || null,
          file_type: resumeData.fileType || null
        })
        .select();
      
      if (error) {
        console.error("Error inserting resume:", error);
        return NextResponse.json(
          { error: "Failed to save resume" },
          { status: 500 }
        );
      }
      
      result = data[0];
    }
    
    return NextResponse.json({
      message: existingResume ? "Resume updated successfully" : "Resume saved successfully",
      resume: result
    });
    
  } catch (error) {
    console.error("Error in resume API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 