import { UserLevel } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      email: string;
      image: string;
      avatarUrl: string;
      level: UserLevel;
      topLanguages: string[];
      totalStars: number;
      followers: number;
      nickname: string | null;
      gender: string | null;
      skinColor: string | null;
    };
  }
}
