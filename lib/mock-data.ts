// Mock data for preview environments

export const MOCK_PLANS = [
  { id: "1", name: "Starter", description: "Perfect for your upcoming interview", price: 29, credits: 180 },
  { id: "2", name: "Pro", description: "For serious job seekers", price: 49, credits: 480 },
  { id: "3", name: "Enterprise", description: "For teams and organizations", price: 99, credits: 1200 },
]

export const MOCK_USER = {
  id: "1",
  email: "demo@example.com",
  firstName: "Demo",
  lastName: "User",
  credits: 5.2,
  planName: "Pro",
}

// Dashboard statistics
export const MOCK_INTERVIEWS_COMPLETED = 3
export const MOCK_TECHNICAL_QUESTIONS = 24
export const MOCK_UPCOMING_INTERVIEWS = 2

// Mock database data
export const MOCK_DB = {
  users: [
    {
      id: "1",
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      credits: 5.2,
      plan_name: "Pro",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    }
  ],
  interviews: [
    {
      id: "1",
      user_id: "1",
      title: "Frontend Developer at Tech Co",
      status: "completed",
      completed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      duration_minutes: 45,
      feedback: "Good technical knowledge, needs improvement on system design questions."
    },
    {
      id: "2",
      user_id: "1",
      title: "Senior React Developer at Startup",
      status: "completed",
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      duration_minutes: 60,
      feedback: "Excellent communication skills, strong React knowledge."
    },
    {
      id: "3",
      user_id: "1",
      title: "Full Stack Engineer at Enterprise Inc",
      status: "completed",
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      duration_minutes: 55,
      feedback: "Good problem-solving approach, needs to improve on database optimization."
    },
    {
      id: "4",
      user_id: "1",
      title: "Software Engineer at Big Tech",
      status: "scheduled",
      scheduled_for: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      expected_duration_minutes: 60
    },
    {
      id: "5",
      user_id: "1",
      title: "Senior Developer at Finance Corp",
      status: "scheduled",
      scheduled_for: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      expected_duration_minutes: 45
    }
  ],
  interview_questions: [
    ...Array(24).fill(null).map((_, i) => ({
      id: `q${i + 1}`,
      user_id: "1",
      interview_id: ["1", "2", "3"][Math.floor(i / 8)], // Distribute among the 3 completed interviews
      question: `Technical question ${i + 1}`,
      type: "technical",
      status: "answered",
      created_at: new Date(Date.now() - (10 - Math.floor(i / 8) * 3) * 24 * 60 * 60 * 1000).toISOString()
    }))
  ]
}
