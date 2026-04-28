interface GitHubRepo {
  stargazers_count: number;
  language: string | null;
}

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  html_url: string;
  followers: number;
  public_repos: number;
}

export interface GitHubProfile {
  username: string;
  name: string;
  avatarUrl: string;
  bio: string | null;
  githubUrl: string;
  topLanguages: string[];
  totalStars: number;
  totalRepos: number;
  followers: number;
}

export async function fetchGitHubProfile(
  accessToken: string
): Promise<GitHubProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };

  const [userRes, reposRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers }),
    fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers,
    }),
  ]);

  const user: GitHubUser = await userRes.json();
  const repos: GitHubRepo[] = await reposRes.json();

  const totalStars = repos.reduce(
    (sum, repo) => sum + (repo.stargazers_count ?? 0),
    0
  );

  const languageCounts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] ?? 0) + 1;
    }
  }
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  return {
    username: user.login,
    name: user.name ?? user.login,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    githubUrl: user.html_url,
    topLanguages,
    totalStars,
    totalRepos: user.public_repos,
    followers: user.followers,
  };
}

export function calculateLevel(followers: number, totalStars: number): string {
  const score = Math.max(followers, totalStars);
  if (score >= 5000) return "LEGEND";
  if (score >= 1000) return "EXPERT";
  if (score >= 100) return "SENIOR";
  if (score >= 10) return "JUNIOR";
  return "NEWCOMER";
}
