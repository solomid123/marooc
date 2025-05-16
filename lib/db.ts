import { neon } from "@neondatabase/serverless"
import { MOCK_PLANS, MOCK_USER } from "./mock-data"

// Check if we're in a preview environment
const isPreview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"

// Only initialize SQL client if not in preview
const sql = !isPreview && process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

// Helper function to execute raw SQL queries with better error handling
export async function executeQuery(query: string, params: any[] = []) {
  // In preview mode, return mock data based on the query
  if (isPreview) {
    return handleMockQuery(query, params)
  }

  if (!sql) {
    console.error("Database connection not initialized. Check DATABASE_URL environment variable.")
    throw new Error("Database connection not available")
  }

  try {
    return await sql.query(query, params)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Function to check if database connection is available
export async function isDatabaseConnected() {
  // In preview mode, always return true
  if (isPreview) return true

  if (!sql) return false

  try {
    await sql.query("SELECT 1")
    return true
  } catch (error) {
    console.error("Database connection check failed:", error)
    return false
  }
}

// Mock query handler for preview environments
function handleMockQuery(query: string, params: any[] = []) {
  console.log("Using mock data for query:", query)

  // Return mock data based on the query
  if (query.includes("SELECT") && query.includes("FROM plans")) {
    return MOCK_PLANS
  }

  if (query.includes("SELECT") && query.includes("FROM users")) {
    return [MOCK_USER]
  }

  if (query.includes("SELECT") && query.includes("FROM sessions")) {
    return [{ user_id: MOCK_USER.id, expires: new Date(Date.now() + 86400000) }]
  }

  // For INSERT, UPDATE, DELETE queries, return a success response
  if (query.includes("INSERT") || query.includes("UPDATE") || query.includes("DELETE")) {
    return [{ id: 1, affected_rows: 1 }]
  }

  // Default fallback
  return []
}
