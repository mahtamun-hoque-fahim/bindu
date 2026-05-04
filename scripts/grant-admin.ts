#!/usr/bin/env npx tsx
/**
 * Grant admin access to a user by email.
 * Usage: npx tsx scripts/grant-admin.ts user@example.com
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
  console.error('Usage: npx tsx scripts/grant-admin.ts user@example.com')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED!)
const db = drizzle(sql, { schema })

const [user] = await db
  .select({ id: schema.users.id, email: schema.users.email })
  .from(schema.users)
  .where(eq(schema.users.email, email))
  .limit(1)

if (!user) {
  console.error(`No user found with email: ${email}`)
  process.exit(1)
}

await db
  .insert(schema.admins)
  .values({ userId: user.id, grantedBy: null })
  .onConflictDoNothing()

console.log(`✅  Admin access granted to ${email} (${user.id})`)
process.exit(0)
