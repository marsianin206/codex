import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

const handlers = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || 'dummy',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy',
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
});

export const { GET, POST } = handlers;