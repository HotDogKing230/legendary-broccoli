export interface MiningPool {
  id: string;
  name: string;
  url: string;
  port: number;
  website: string;
  fee: number;
  minPayout: number;
}

// List of popular XMR mining pools
export const miningPools: MiningPool[] = [
  {
    id: "supportxmr",
    name: "supportXMR",
    url: "pool.supportxmr.com",
    port: 3333,
    website: "https://supportxmr.com",
    fee: 0.6,
    minPayout: 0.01
  },
  {
    id: "minexmr",
    name: "mineXMR",
    url: "pool.minexmr.com",
    port: 4444,
    website: "https://minexmr.com",
    fee: 1.0,
    minPayout: 0.004
  },
  {
    id: "nanopool",
    name: "nanopool",
    url: "xmr-eu1.nanopool.org",
    port: 14444,
    website: "https://xmr.nanopool.org",
    fee: 1.0,
    minPayout: 0.1
  },
  {
    id: "hashvault",
    name: "HashVault",
    url: "pool.hashvault.pro",
    port: 3333,
    website: "https://monero.hashvault.pro",
    fee: 0.9,
    minPayout: 0.1
  }
];

// Get pool details by ID
export function getPoolById(id: string): MiningPool | undefined {
  return miningPools.find(pool => pool.id === id);
}

// Get pool connection string (url:port)
export function getPoolConnectionString(pool: MiningPool): string {
  return `${pool.url}:${pool.port}`;
}

// Get default pool
export function getDefaultPool(): MiningPool {
  return miningPools[0]; // supportXMR
}
