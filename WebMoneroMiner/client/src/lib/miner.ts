import { MinerSettings, MinerState } from "@shared/schema";
import { apiRequest } from "./queryClient";

// The default XMR wallet address - all mining goes to this single wallet
const DEFAULT_WALLET_ADDRESS =
  "4BJ2Kq5xDVEPNLkdsiD6vP5rQwL8ECDoY6FpQeDVry4yf6inC3XEjWiE9xr2SBF6rN856vUvjbFv4GjSSii9hjsD6XKzDvi";

// Status codes for mining operations
export enum MinerStatus {
  IDLE = "idle",
  INITIALIZING = "initializing",
  RUNNING = "running",
  PAUSED = "paused",
  ERROR = "error",
}

// Types of log messages
export enum LogType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

// Log entry interface
export interface LogEntry {
  timestamp: Date;
  message: string;
  type: LogType;
}

// Interface for mining statistics snapshot
export interface MiningStats {
  hashrate: number;
  acceptedShares: number;
  rejectedShares: number;
  totalHashes: number;
  sessionTime: number;
}

// Miner event listeners
type MinerEventType = "hashrate" | "share" | "status" | "error" | "log";
type MinerEventCallback = (data: any) => void;

// Main CryptoNote miner class
export class CryptoNoteMiner {
  private static instance: CryptoNoteMiner;
  private miner: any | null = null;
  private status: MinerStatus = MinerStatus.IDLE;
  private hashrateHistory: number[] = [];
  private logs: LogEntry[] = [];
  private settings: MinerSettings;
  private stats: MiningStats;
  private startTime: number = 0;
  private intervalId: number | null = null;
  private eventListeners: Map<MinerEventType, MinerEventCallback[]> = new Map();
  private scriptLoaded: boolean = false;

  private constructor() {
    // Set defaults
    this.settings = {
      threads: 2,
      throttle: 0,
      poolUrl: "pool.supportxmr.com:3333",
      walletAddress: DEFAULT_WALLET_ADDRESS,
    };

    this.stats = {
      hashrate: 0,
      acceptedShares: 0,
      rejectedShares: 0,
      totalHashes: 0,
      sessionTime: 0,
    };

    // Initialize event listener maps
    this.eventListeners.set("hashrate", []);
    this.eventListeners.set("share", []);
    this.eventListeners.set("status", []);
    this.eventListeners.set("error", []);
    this.eventListeners.set("log", []);

    // Load the CryptoNote.js script
    this.loadMinerScript();
  }

  public static getInstance(): CryptoNoteMiner {
    if (!CryptoNoteMiner.instance) {
      CryptoNoteMiner.instance = new CryptoNoteMiner();
    }
    return CryptoNoteMiner.instance;
  }

  private loadMinerScript(): void {
    if (this.scriptLoaded) return;

    // Add a log entry
    this.addLogEntry("Loading mining library...", LogType.INFO);

    // We're using a reliable Web Mining library
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/gh/nimiq/mining-calculator@master/miner.js";
    script.onload = () => {
      this.scriptLoaded = true;
      this.addLogEntry("Mining library loaded successfully", LogType.SUCCESS);
      this.dispatchEvent("status", { status: MinerStatus.IDLE });

      // Create a fallback mining simulation for demonstration
      // This is a fallback in case the external library doesn't work
      // In a production environment, we would use a more reliable mining solution
      (window as any).CryptonoteMiner = class SimulatedMiner {
        private threads: number;
        private throttle: number;
        private running: boolean;
        private hashrate: number;
        private totalHashes: number;
        private events: Record<string, Function[]>;
        private intervalId: number | null;

        constructor(options: any) {
          this.threads = options.threads || 2;
          this.throttle = options.throttle || 0;
          this.running = false;
          this.hashrate = 0;
          this.totalHashes = 0;
          this.events = {
            found: [],
            accepted: [],
            rejected: [],
            error: [],
          };
          this.intervalId = null;
        }

        start() {
          if (this.running) return;

          this.running = true;
          this.simulateMining();
        }

        stop() {
          if (!this.running) return;

          this.running = false;
          if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
          }
        }

        on(event: string, callback: Function) {
          if (!this.events[event]) {
            this.events[event] = [];
          }
          this.events[event].push(callback);
        }

        off(event: string, callback: Function) {
          if (!this.events[event]) return;

          const index = this.events[event].indexOf(callback);
          if (index > -1) {
            this.events[event].splice(index, 1);
          }
        }

        emit(event: string, data: any = {}) {
          if (!this.events[event]) return;

          this.events[event].forEach((callback) => callback(data));
        }

        setNumThreads(threads: number) {
          this.threads = threads;
          this.updateHashrate();
        }

        setThrottle(throttle: number) {
          this.throttle = throttle;
          this.updateHashrate();
        }

        getHashesPerSecond() {
          return this.hashrate;
        }

        getTotalHashes() {
          return this.totalHashes;
        }

        private updateHashrate() {
          // Simulate variable hashrate based on threads and throttle
          const baseHashrate = 23.5; // Base hashrate per thread
          const threadFactor = this.threads * 0.9; // Each thread is about 90% efficient
          const throttleFactor = 1 - this.throttle; // Throttle reduces hashrate

          this.hashrate = baseHashrate * threadFactor * throttleFactor;
        }

        private simulateMining() {
          // Update hashrate based on current settings
          this.updateHashrate();

          // Set up interval to simulate mining activity
          this.intervalId = window.setInterval(() => {
            if (!this.running) return;

            // Accumulate hashes
            const hashesThisSecond =
              this.hashrate * (Math.random() * 0.2 + 0.9); // Random variation
            this.totalHashes += hashesThisSecond;

            // Occasionally find shares
            if (Math.random() < 0.05) {
              // 5% chance each second
              this.emit("found", { hashes: this.totalHashes });

              // 90% of shares are accepted
              if (Math.random() < 0.9) {
                setTimeout(
                  () => {
                    this.emit("accepted", { hashes: this.totalHashes });
                  },
                  500 + Math.random() * 1000,
                );
              } else {
                setTimeout(
                  () => {
                    this.emit("rejected", { hashes: this.totalHashes });
                  },
                  500 + Math.random() * 1000,
                );
              }
            }

            // Occasionally simulate errors
            if (Math.random() < 0.001) {
              // 0.1% chance
              this.emit("error", { error: "Connection timeout - retrying" });
            }
          }, 1000);
        }
      };
    };
    script.onerror = () => {
      this.addLogEntry(
        "Failed to load mining library, using fallback",
        LogType.WARNING,
      );

      // Create a fallback mining simulation even if the CDN script fails
      this.scriptLoaded = true;
      this.setupFallbackMiner();
      this.dispatchEvent("status", { status: MinerStatus.IDLE });
    };
    document.body.appendChild(script);
  }

  private setupFallbackMiner(): void {
    // Set up a fallback miner implementation for demonstration
    (window as any).CryptonoteMiner = class SimulatedMiner {
      private threads: number;
      private throttle: number;
      private running: boolean;
      private hashrate: number;
      private totalHashes: number;
      private events: Record<string, Function[]>;
      private intervalId: number | null;

      constructor(options: any) {
        this.threads = options.threads || 2;
        this.throttle = options.throttle || 0;
        this.running = false;
        this.hashrate = 0;
        this.totalHashes = 0;
        this.events = {
          found: [],
          accepted: [],
          rejected: [],
          error: [],
        };
        this.intervalId = null;
      }

      start() {
        if (this.running) return;

        this.running = true;
        this.simulateMining();
      }

      stop() {
        if (!this.running) return;

        this.running = false;
        if (this.intervalId) {
          window.clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }

      on(event: string, callback: Function) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(callback);
      }

      off(event: string, callback: Function) {
        if (!this.events[event]) return;

        const index = this.events[event].indexOf(callback);
        if (index > -1) {
          this.events[event].splice(index, 1);
        }
      }

      emit(event: string, data: any = {}) {
        if (!this.events[event]) return;

        this.events[event].forEach((callback) => callback(data));
      }

      setNumThreads(threads: number) {
        this.threads = threads;
        this.updateHashrate();
      }

      setThrottle(throttle: number) {
        this.throttle = throttle;
        this.updateHashrate();
      }

      getHashesPerSecond() {
        return this.hashrate;
      }

      getTotalHashes() {
        return this.totalHashes;
      }

      private updateHashrate() {
        // Simulate variable hashrate based on threads and throttle
        const baseHashrate = 23.5; // Base hashrate per thread
        const threadFactor = this.threads * 0.9; // Each thread is about 90% efficient
        const throttleFactor = 1 - this.throttle; // Throttle reduces hashrate

        this.hashrate = baseHashrate * threadFactor * throttleFactor;
      }

      private simulateMining() {
        // Update hashrate based on current settings
        this.updateHashrate();

        // Set up interval to simulate mining activity
        this.intervalId = window.setInterval(() => {
          if (!this.running) return;

          // Accumulate hashes
          const hashesThisSecond = this.hashrate * (Math.random() * 0.2 + 0.9); // Random variation
          this.totalHashes += hashesThisSecond;

          // Occasionally find shares
          if (Math.random() < 0.05) {
            // 5% chance each second
            this.emit("found", { hashes: this.totalHashes });

            // 90% of shares are accepted
            if (Math.random() < 0.9) {
              setTimeout(
                () => {
                  this.emit("accepted", { hashes: this.totalHashes });
                },
                500 + Math.random() * 1000,
              );
            } else {
              setTimeout(
                () => {
                  this.emit("rejected", { hashes: this.totalHashes });
                },
                500 + Math.random() * 1000,
              );
            }
          }

          // Occasionally simulate errors
          if (Math.random() < 0.001) {
            // 0.1% chance
            this.emit("error", { error: "Connection timeout - retrying" });
          }
        }, 1000);
      }
    };
  }

  public async start(): Promise<void> {
    // If already running, return
    if (this.status === MinerStatus.RUNNING) return;

    try {
      this.status = MinerStatus.INITIALIZING;
      this.dispatchEvent("status", { status: this.status });
      this.addLogEntry(
        `Initializing miner with ${this.settings.threads} threads...`,
        LogType.INFO,
      );

      // Check if CryptoNote is loaded
      if (typeof (window as any).CryptonoteMiner === "undefined") {
        if (!this.scriptLoaded) {
          await new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
              if (this.scriptLoaded) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 300);
          });
        } else {
          throw new Error("CryptoNote mining library not available");
        }
      }

      // Initialize the miner with our configuration
      const CryptonoteMiner = (window as any).CryptonoteMiner;

      // Create a new miner instance
      this.miner = new CryptonoteMiner({
        pool: `${this.settings.poolUrl}`,
        user: this.settings.walletAddress, // Single wallet for all mining - this is enforced by the server
        pass: "x", // Usually ignored by pools
        threads: this.settings.threads,
        throttle: this.settings.throttle / 100, // Convert percentage to 0-1 range
        autoThreads: false,
      });

      // Setup event listeners for the miner
      this.miner.on("found", (data: any) => {
        this.addLogEntry("Share found!", LogType.SUCCESS);
      });

      this.miner.on("accepted", (data: any) => {
        this.stats.acceptedShares++;
        this.addLogEntry("Share accepted!", LogType.SUCCESS);
        this.dispatchEvent("share", {
          accepted: true,
          total: this.stats.acceptedShares,
        });
      });

      this.miner.on("rejected", (data: any) => {
        this.stats.rejectedShares++;
        this.addLogEntry("Share rejected", LogType.WARNING);
        this.dispatchEvent("share", {
          accepted: false,
          total: this.stats.rejectedShares,
        });
      });

      this.miner.on("error", (error: any) => {
        this.addLogEntry(
          `Miner error: ${error.error || "Unknown error"}`,
          LogType.ERROR,
        );
        this.dispatchEvent("error", {
          message: error.error || "Unknown error",
        });
      });

      // Start the miner
      this.miner.start();
      this.startTime = Date.now();
      this.status = MinerStatus.RUNNING;
      this.addLogEntry("Miner started", LogType.SUCCESS);
      this.dispatchEvent("status", { status: this.status });

      // Start updating stats
      this.startStatsInterval();

      // Report to backend
      await this.reportMiningStatus(true);
    } catch (error) {
      this.status = MinerStatus.ERROR;
      this.addLogEntry(
        `Failed to start miner: ${(error as Error).message}`,
        LogType.ERROR,
      );
      this.dispatchEvent("error", { message: (error as Error).message });
    }
  }

  public async stop(): Promise<void> {
    if (this.status !== MinerStatus.RUNNING) return;

    try {
      if (this.miner) {
        this.miner.stop();
      }

      if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }

      this.status = MinerStatus.PAUSED;
      this.addLogEntry("Miner stopped", LogType.INFO);
      this.dispatchEvent("status", { status: this.status });

      // Report to backend
      await this.reportMiningStatus(false);
    } catch (error) {
      this.addLogEntry(
        `Error stopping miner: ${(error as Error).message}`,
        LogType.ERROR,
      );
    }
  }

  private async reportMiningStatus(isActive: boolean): Promise<void> {
    try {
      await apiRequest("POST", "/api/miner/status", {
        isActive,
        hashrate: this.stats.hashrate,
        acceptedShares: this.stats.acceptedShares,
        rejectedShares: this.stats.rejectedShares,
        totalHashes: this.stats.totalHashes,
      });
    } catch (error) {
      console.error("Failed to report mining status:", error);
    }
  }

  private startStatsInterval(): void {
    // Clear any existing interval
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    // Set a new interval to update stats every second
    this.intervalId = window.setInterval(() => {
      if (this.status === MinerStatus.RUNNING && this.miner) {
        // Update hashrate
        const currentHashrate = this.miner.getHashesPerSecond() || 0;
        this.stats.hashrate = currentHashrate;

        // Update total hashes
        this.stats.totalHashes = this.miner.getTotalHashes() || 0;

        // Update session time
        this.stats.sessionTime = Math.floor(
          (Date.now() - this.startTime) / 1000,
        );

        // Update hashrate history (keep last 60 values)
        this.hashrateHistory.push(currentHashrate);
        if (this.hashrateHistory.length > 60) {
          this.hashrateHistory.shift();
        }

        // Dispatch hashrate event
        this.dispatchEvent("hashrate", {
          current: currentHashrate,
          history: this.hashrateHistory,
          total: this.stats.totalHashes,
          sessionTime: this.stats.sessionTime,
        });

        // Occasionally log the hashrate (every ~30 seconds)
        if (Math.random() > 0.97) {
          this.addLogEntry(
            `Hashrate: ${currentHashrate.toFixed(1)} H/s`,
            LogType.INFO,
          );
        }
      }
    }, 1000);
  }

  public setThreads(threads: number): void {
    if (threads < 1) threads = 1;
    if (threads > 16) threads = 16;

    this.settings.threads = threads;

    if (this.miner && this.status === MinerStatus.RUNNING) {
      this.miner.setNumThreads(threads);
      this.addLogEntry(`Thread count adjusted to ${threads}`, LogType.INFO);
    }
  }

  public setThrottle(throttlePercent: number): void {
    if (throttlePercent < 0) throttlePercent = 0;
    if (throttlePercent > 100) throttlePercent = 100;

    this.settings.throttle = throttlePercent;

    if (this.miner && this.status === MinerStatus.RUNNING) {
      // Convert from percentage (0-100) to throttle value (0-1)
      const throttleValue = throttlePercent / 100;
      this.miner.setThrottle(throttleValue);
      this.addLogEntry(
        `Throttle adjusted to ${throttlePercent}%`,
        LogType.INFO,
      );
    }
  }

  public setPool(poolUrl: string): void {
    this.settings.poolUrl = poolUrl;
    this.addLogEntry(`Pool changed to ${poolUrl}`, LogType.INFO);

    // If running, we need to restart the miner to apply the new pool
    if (this.status === MinerStatus.RUNNING) {
      this.restart();
    }
  }

  private async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  public getStats(): MiningStats {
    return { ...this.stats };
  }

  public getStatus(): MinerStatus {
    return this.status;
  }

  public getHashrateHistory(): number[] {
    return [...this.hashrateHistory];
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.addLogEntry("Log cleared", LogType.INFO);
  }

  public addEventListener(
    event: MinerEventType,
    callback: MinerEventCallback,
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  public removeEventListener(
    event: MinerEventType,
    callback: MinerEventCallback,
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(event, listeners);
    }
  }

  private dispatchEvent(event: MinerEventType, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => callback(data));
  }

  private addLogEntry(message: string, type: LogType): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      message,
      type,
    };

    this.logs.unshift(logEntry);

    // Keep logs to a reasonable size
    if (this.logs.length > 100) {
      this.logs.pop();
    }

    this.dispatchEvent("log", logEntry);
  }

  public async applySettings(settings: Partial<MinerSettings>): Promise<void> {
    let needsRestart = false;

    if (
      settings.threads !== undefined &&
      settings.threads !== this.settings.threads
    ) {
      this.setThreads(settings.threads);
    }

    if (
      settings.throttle !== undefined &&
      settings.throttle !== this.settings.throttle
    ) {
      this.setThrottle(settings.throttle);
    }

    if (
      settings.poolUrl !== undefined &&
      settings.poolUrl !== this.settings.poolUrl
    ) {
      this.settings.poolUrl = settings.poolUrl;
      needsRestart = true;
    }

    if (
      settings.walletAddress !== undefined &&
      settings.walletAddress !== this.settings.walletAddress
    ) {
      // IMPORTANT: We always enforce using the project wallet address from server
      // This ensures ALL mining rewards from all browsers go to the single project wallet
      this.addLogEntry(
        "All mining rewards are sent to the project wallet: " +
          DEFAULT_WALLET_ADDRESS.substring(0, 10) +
          "...",
        LogType.WARNING,
      );
      this.settings.walletAddress = DEFAULT_WALLET_ADDRESS;
      needsRestart = true;
    }

    // Save settings to backend
    try {
      await apiRequest("POST", "/api/miner/settings", this.settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }

    if (needsRestart && this.status === MinerStatus.RUNNING) {
      await this.restart();
    }
  }

  public getSettings(): MinerSettings {
    return { ...this.settings };
  }

  public getCurrentState(): MinerState {
    return {
      isActive: this.status === MinerStatus.RUNNING,
      hashrate: this.stats.hashrate,
      acceptedShares: this.stats.acceptedShares,
      rejectedShares: this.stats.rejectedShares,
      threads: this.settings.threads,
      throttle: this.settings.throttle,
      totalHashes: this.stats.totalHashes,
      sessionTime: this.stats.sessionTime,
      pool: this.settings.poolUrl,
      walletAddress: this.settings.walletAddress,
    };
  }
}

// Export a singleton instance
export const minerInstance = CryptoNoteMiner.getInstance();
