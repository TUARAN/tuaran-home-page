import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile?.id) {
        token.githubId = String(profile.id)
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.githubId || token.sub
      }
      return session
    },
  },
})
