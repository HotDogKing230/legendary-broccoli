import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Mining related schemas
export const miningStats = pgTable("mining_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  hashrate: integer("hashrate").notNull(),
  acceptedShares: integer("accepted_shares").notNull().default(0),
  rejectedShares: integer("rejected_shares").notNull().default(0),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertMiningStatsSchema = createInsertSchema(miningStats).pick({
  userId: true,
  hashrate: true,
  acceptedShares: true,
  rejectedShares: true,
});

export type InsertMiningStats = z.infer<typeof insertMiningStatsSchema>;
export type MiningStats = typeof miningStats.$inferSelect;

export const miningSettings = pgTable("mining_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  threads: integer("threads").notNull().default(2),
  throttle: integer("throttle").notNull().default(0),
  poolUrl: text("pool_url").notNull().default("pool.supportxmr.com:3333"),
  isActive: boolean("is_active").notNull().default(false),
});

export const insertMiningSettingsSchema = createInsertSchema(miningSettings).pick({
  userId: true,
  walletAddress: true,
  threads: true,
  throttle: true,
  poolUrl: true,
  isActive: true,
});

export type InsertMiningSettings = z.infer<typeof insertMiningSettingsSchema>;
export type MiningSettings = typeof miningSettings.$inferSelect;

// Define the API response types for the frontend
export type MinerState = {
  isActive: boolean;
  hashrate: number;
  acceptedShares: number;
  rejectedShares: number;
  threads: number;
  throttle: number;
  totalHashes: number;
  sessionTime: number;
  pool: string;
  walletAddress: string;
};

export const minerStateSchema = z.object({
  isActive: z.boolean(),
  hashrate: z.number(),
  acceptedShares: z.number(),
  rejectedShares: z.number(),
  threads: z.number(),
  throttle: z.number(),
  totalHashes: z.number(),
  sessionTime: z.number(),
  pool: z.string(),
  walletAddress: z.string(),
});

export type MinerSettings = {
  threads: number;
  throttle: number;
  poolUrl: string;
  walletAddress: string;
};

export const minerSettingsSchema = z.object({
  threads: z.number().min(1).max(16),
  throttle: z.number().min(0).max(100),
  poolUrl: z.string(),
  walletAddress: z.string().min(95).max(110),
});
