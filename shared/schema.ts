import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth Tables
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const wasteItems = pgTable("waste_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  imageUrl: text("image_url").notNull(),
  detectedItem: text("detected_item"),
  category: text("category").notNull(), // "Wet Waste" | "Dry Waste" | "Recyclable Waste"
  confidence: integer("confidence").notNull(), // 0-100
  certainty: text("certainty").notNull(), // "certain" | "uncertain"
  disposalInstruction: text("disposal_instruction").notNull(),
  userDisposalCorrect: boolean("user_disposal_correct"),
  pointsChange: integer("points_change"),
  educationalExplanation: text("educational_explanation"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).unique(),
  totalPoints: integer("total_points").default(0).notNull(),
  scansCount: integer("scans_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===
export const wasteItemsRelations = relations(wasteItems, ({ one }) => ({
  user: one(users, {
    fields: [wasteItems.userId],
    references: [users.id],
  }),
}));

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [leaderboard.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertWasteItemSchema = createInsertSchema(wasteItems).omit({ 
  id: true, 
  createdAt: true,
  userId: true 
});

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type WasteItem = typeof wasteItems.$inferSelect;
export type InsertWasteItem = z.infer<typeof insertWasteItemSchema>;
export type LeaderboardEntry = typeof leaderboard.$inferSelect;

// Request types
export type AnalyzeWasteRequest = {
  image: string; // Base64 encoded image
};

export type ConfirmDisposalRequest = {
  wasteItemId: number;
  binType: "Wet Waste" | "Dry Waste" | "Recyclable Waste";
};

// Response types
export type AnalyzeWasteResponse = {
  id?: number; // Optional because we might return analysis before saving if uncertain
  detected_item: string;
  category: "Wet Waste" | "Dry Waste" | "Recyclable Waste";
  confidence: number;
  certainty: "certain" | "uncertain";
  disposal_instruction: string;
  educational_explanation: string;
  retry_message?: string;
};

export type ConfirmDisposalResponse = {
  correct: boolean;
  pointsChange: number;
  totalPoints: number;
  message: string;
};

export type LeaderboardResponse = (LeaderboardEntry & { 
  username: string | null; 
  firstName: string | null; 
  lastName: string | null;
  profileImageUrl: string | null;
})[];

export type UserStatsResponse = {
  totalPoints: number;
  scansCount: number;
  recentScans: WasteItem[];
};
