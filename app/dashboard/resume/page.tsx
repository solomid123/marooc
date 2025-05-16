import { ResumeManagementPage } from "./resume-management-page";
import { getCurrentUser } from "@/lib/get-current-user";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MOCK_DB } from "@/lib/mock-data";

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development";

export default async function ResumePage() {
  // In development mode, use mock data
  if (isPreview) {
    console.log("Resume page: Development mode detected, using mock data");
    
    // Mock resume data
    const mockResume = {
      name: "Demo User",
      email: "demo@example.com",
      phone: "(555) 123-4567",
      summary: "Experienced frontend developer with 5+ years of experience building responsive web applications using modern JavaScript frameworks.",
      skills: ["JavaScript", "React", "TypeScript", "Node.js", "API Integration", "UI/UX Design"],
      experience: [
        "Senior Frontend Developer at Tech Corp (2020-Present)",
        "Web Developer at Startup Inc. (2018-2020)",
        "Junior Developer at Code Agency (2016-2018)"
      ],
      education: ["Bachelor of Science in Computer Science, University State (2016)"]
    };
    
    return <ResumeManagementPage resumeData={mockResume} />;
  }

  // Production mode - use real data
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  const supabase = createClient();
  
  // Fetch user's resume data
  // Note: In a real app, you would have a separate table for resumes
  // This is a simplified example
  const { data: resumeData, error } = await supabase
    .from("user_resumes")
    .select("*")
    .eq("user_id", user.id)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    console.error("Error fetching resume data:", error);
  return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Resume Manager</h1>
        <p className="text-red-500">Failed to load resume data. Please try again later.</p>
      </div>
    );
  }
  
  // If no resume data found, return the page with empty data
  if (!resumeData) {
    return <ResumeManagementPage resumeData={null} />;
  }
  
  return <ResumeManagementPage resumeData={resumeData} />;
} 