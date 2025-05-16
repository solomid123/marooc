import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { MOCK_PLANS } from "@/lib/mock-data"

export async function GET() {
  try {
    const plans = await executeQuery("SELECT id, name, description, price, credits FROM plans ORDER BY price ASC")

    return NextResponse.json({ plans: plans.length > 0 ? plans : MOCK_PLANS })
  } catch (error) {
    console.error("Error fetching plans:", error)
    // Return mock plans on error
    return NextResponse.json({ plans: MOCK_PLANS })
  }
}
