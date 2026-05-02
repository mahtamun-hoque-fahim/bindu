// This route is no longer needed with next-auth — user sync happens at registration
// Kept as a stub for backwards compatibility
import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ ok: true })
}
