import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { fetchGitHubProfile, calculateLevel } from "@/lib/github";
import { UserLevel } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: { scope: "read:user user:email" },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github" || !account.access_token) return true;

      try {
        const profile = await fetchGitHubProfile(account.access_token);
        const level = calculateLevel(profile.followers, profile.totalStars) as UserLevel;

        await prisma.user.upsert({
          where: { githubId: String(account.providerAccountId) },
          update: {
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            topLanguages: profile.topLanguages,
            totalStars: profile.totalStars,
            totalRepos: profile.totalRepos,
            followers: profile.followers,
            level,
          },
          create: {
            githubId: String(account.providerAccountId),
            username: profile.username,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            githubUrl: profile.githubUrl,
            topLanguages: profile.topLanguages,
            totalStars: profile.totalStars,
            totalRepos: profile.totalRepos,
            followers: profile.followers,
            level,
          },
        });
      } catch (error) {
        console.error("GitHub profile sync failed:", error);
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { githubId: token.sub },
          select: {
            id: true,
            username: true,
            level: true,
            avatarUrl: true,
            topLanguages: true,
            totalStars: true,
            followers: true,
            nickname: true,
            gender: true,
            skinColor: true,
          },
        });
        if (dbUser) {
          session.user = { ...session.user, ...dbUser };
        }
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      return token;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
