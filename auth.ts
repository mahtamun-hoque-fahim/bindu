import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { eq } from 'drizzle-orm'
import { compare } from 'bcryptjs'
import { getDb } from '@/lib/db'
import { users } from '@/lib/db/schema'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  providers: [
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
    async signIn({ user }) {
      if (!user.id) return true
      const db = getDb()
      if (!db) return true
      const [dbUser] = await db
        .select({ isBanned: users.isBanned })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
      return !dbUser?.isBanned
    },
  },
})
