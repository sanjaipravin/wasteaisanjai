import { db } from "./db";
import { 
  wasteItems, leaderboard, users,
  type InsertWasteItem, type WasteItem, type LeaderboardEntry
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Waste Items
  createWasteItem(item: InsertWasteItem): Promise<WasteItem>;
  getWasteItem(id: number): Promise<WasteItem | undefined>;
  getUserWasteHistory(userId: string): Promise<WasteItem[]>;
  updateWasteItemDisposal(id: number, correct: boolean, points: number): Promise<WasteItem>;

  // Leaderboard / Stats
  getLeaderboard(): Promise<(LeaderboardEntry & { 
    username: string | null; 
    firstName: string | null; 
    lastName: string | null; 
    profileImageUrl: string | null;
  })[]>;
  getUserStats(userId: string): Promise<LeaderboardEntry | undefined>;
  updateUserPoints(userId: string, pointsToAdd: number): Promise<LeaderboardEntry>;
  ensureLeaderboardEntry(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createWasteItem(item: InsertWasteItem): Promise<WasteItem> {
    const [newItem] = await db.insert(wasteItems).values(item).returning();
    return newItem;
  }

  async getWasteItem(id: number): Promise<WasteItem | undefined> {
    const [item] = await db.select().from(wasteItems).where(eq(wasteItems.id, id));
    return item;
  }

  async getUserWasteHistory(userId: string): Promise<WasteItem[]> {
    return db.select()
      .from(wasteItems)
      .where(eq(wasteItems.userId, userId))
      .orderBy(desc(wasteItems.createdAt));
  }

  async updateWasteItemDisposal(id: number, correct: boolean, points: number): Promise<WasteItem> {
    const [updated] = await db.update(wasteItems)
      .set({ 
        userDisposalCorrect: correct,
        pointsChange: points
      })
      .where(eq(wasteItems.id, id))
      .returning();
    return updated;
  }

  async getLeaderboard() {
    return db.select({
      id: leaderboard.id,
      userId: leaderboard.userId,
      totalPoints: leaderboard.totalPoints,
      scansCount: leaderboard.scansCount,
      updatedAt: leaderboard.updatedAt,
      username: users.email, // Using email as username fallback if not present
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(leaderboard)
    .leftJoin(users, eq(leaderboard.userId, users.id))
    .orderBy(desc(leaderboard.totalPoints))
    .limit(50);
  }

  async getUserStats(userId: string): Promise<LeaderboardEntry | undefined> {
    const [stats] = await db.select().from(leaderboard).where(eq(leaderboard.userId, userId));
    return stats;
  }

  async ensureLeaderboardEntry(userId: string): Promise<void> {
    const exists = await this.getUserStats(userId);
    if (!exists) {
      await db.insert(leaderboard).values({ userId, totalPoints: 0, scansCount: 0 });
    }
  }

  async updateUserPoints(userId: string, pointsToAdd: number): Promise<LeaderboardEntry> {
    await this.ensureLeaderboardEntry(userId);
    const [updated] = await db.update(leaderboard)
      .set({
        totalPoints: sql`${leaderboard.totalPoints} + ${pointsToAdd}`,
        scansCount: sql`${leaderboard.scansCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(leaderboard.userId, userId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
