export interface User {
  id: string;
  firebaseUid: string;
  displayName: string;
  avatarUrl: string | null;
  coins: number;
  totalLikes: number;
  levelsCreated: number;
  levelsPlayed: number;
  highScore: number;
  isPremium: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface UserStats {
  totalScore: number;
  totalLikes: number;
  levelsCreated: number;
  levelsPlayed: number;
  levelsCompleted: number;
  highScore: number;
  avgCompletionRate: number;
  rank: number;
}

export interface UserProfile {
  user: User;
  stats: UserStats;
}
