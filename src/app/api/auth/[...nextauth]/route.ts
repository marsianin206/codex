import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const handlers = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || 'dummy',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy',
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      const dbUser = await db.query.users.findFirst({
        where: eq(users.email, session.user.email!),
      });
      if (dbUser && session.user) {
        session.user.id = dbUser.id;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'github' || account?.provider === 'google') {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        });
        
        if (!existingUser) {
          const username = user.email?.split('@')[0].replace(/[^a-zA-Z0-9-_]/g, '') || 'user';
          const uniqueUsername = `${username}${Date.now().toString(36)}`;
          
          await db.insert(users).values({
            id: user.id,
            email: user.email!,
            name: user.name,
            image: user.image,
            username: uniqueUsername,
          });
        }
      }
      return true;
    },
  },
  session: {
    strategy: 'jwt',
  },
});

export const GET = handlers.GET;
export const POST = handlers.POST;