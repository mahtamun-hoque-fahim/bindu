import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { compare } from 'bcryptjs'
import { getDb } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema'

// DrizzleAdapter must be lazy-initialized (not at module scope) for Cloudflare Edge
function getAdapter() {
  return DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  })
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: getAdapter(),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const db = getDb()
        if (!db) return null

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1)

        if (!user || !user.password) return null

        const valid = await compare(
          credentials.password as string,
          user.password
        )
        if (!valid) return null
        if (user.isBanned) return null

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
    async signIn({ user, account }) {
      // Block banned users
      if (!user.id) return true
      const db = getDb()
      if (!db) return true
      const [dbUser] = await db
        .select({ isBanned: users.isBanned })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
      if (dbUser?.isBanned) return false

      // Auto-generate username for OAuth users on first sign-in
      if (account?.provider === 'google' && user.email) {
        const [existing] = await db
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, user.id!))
          .limit(1)
        if (!existing?.username) {
          const base = user.email.split('@')[0].replace(/[^a-z0-9_]/gi, '_')
          await db
            .update(users)
            .set({ username: base, displayName: user.name })
            .where(eq(users.id, user.id!))
        }
      }
      return true
    },
  },
})
