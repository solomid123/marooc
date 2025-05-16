import { randomBytes, createHash } from "crypto"

// Generate a random session token
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex")
}

// Hash a password with a random salt using SHA-256
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex")
  return `${salt}:${hash}`
}

// Verify a password against a hash
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, storedHash] = hashedPassword.split(":")
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex")
  return storedHash === hash
}

// Calculate expiration date for session (30 days from now)
export function getSessionExpiry(): Date {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)
  return expiryDate
}
