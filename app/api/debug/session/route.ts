import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { executeQuery } from "@/lib/db"

// Define types for database query results
type SessionResult = {
  id: string;
  user_id: string;
  expires: Date;
}

type UserResult = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "No session token found" }, { status: 401 })
    }

    // Get session details
    const sessionResult = await executeQuery(
      `SELECT s.id, s.user_id, s.expires 
       FROM sessions s 
       WHERE s.session_token = $1`,
      [sessionToken],
    )

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: "No session found for token", token: sessionToken }, { status: 404 })
    }

    // Type assertion for session result
    const session = sessionResult[0] as SessionResult

    // Get user details
    const userResult = await executeQuery(
      `SELECT u.id, u.email, u.first_name, u.last_name
       FROM users u
       WHERE u.id = $1`,
      [session.user_id],
    )

    if (userResult.length === 0) {
      return NextResponse.json({ error: "No user found for session", session }, { status: 404 })
    }

    // Type assertion for user result
    const user = userResult[0] as UserResult

    return NextResponse.json({
      session: {
        id: session.id,
        userId: session.user_id,
        expires: session.expires,
        isExpired: new Date(session.expires) < new Date(),
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    })
  } catch (error) {
    console.error("Session debug error:", error)
    return NextResponse.json({ error: "Failed to get session details" }, { status: 500 })
  }
}
