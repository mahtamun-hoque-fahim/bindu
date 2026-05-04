#!/usr/bin/env npx tsx
/**
 * Revoke admin access from a user by email.
 * Usage: npx tsx scripts/revoke-admin.ts user@example.com
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../lib/db/schema'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/revoke-admin.ts user@example.com')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED!)
const db = drizzle(sql, { schema })

const [user] = await db
  .select({ id: schema.users.id })
  .from(schema.users)
  .where(eq(schema.users.email, email))
  .limit(1)

if (!user) {
  console.error(`No user found with email: ${email}`)
  process.exit(1)
}

await db.delete(schema.admins).where(eq(schema.admins.userId, user.id))

console.log(`✅  Admin access revoked from ${email}`)
process.exit(0)
