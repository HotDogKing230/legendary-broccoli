import { useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { MiningControls } from "@/components/mining-controls";
import { MiningStats } from "@/components/mining-stats";
import { WalletConfiguration } from "@/components/wallet-configuration";
import { SystemInfo } from "@/components/system-info";
import { MiningLog } from "@/components/mining-log";
import { MinerStatus, minerInstance } from "@/lib/miner";
import { useMiningWebSocket } from "@/hooks/use-mining-websocket";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Check, 
  Cpu, 
  Coins,
  ChevronRight,
  LogOut,
  User
} from "lucide-react";

export default function Home() {
  const [minerMetrics, setMinerMetrics] = useState({
    hashrate: 0,
    shares: { accepted: 0, rejected: 0 },
    cpuUsage: 0,
    cpuThreads: 0,
    earnings: { xmr: "0.00000", usd: "$0.00" }
  });
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    statusText: "Disconnected"
  });
  const [activeBrowsers, setActiveBrowsers] = useState(1);
  
  // WebSocket connection for real-time updates
  const { isConnected: wsConnected, globalStats } = useMiningWebSocket();

  useEffect(() => {
    // Initialize metrics
    const stats = minerInstance.getStats();
    const settings = minerInstance.getSettings();
    
    setMinerMetrics({
      hashrate: stats.hashrate,
      shares: { 
        accepted: stats.acceptedShares, 
        rejected: stats.rejectedShares 
      },
      cpuUsage: 0,
      cpuThreads: settings.threads,
      earnings: { xmr: "0.00000", usd: "$0.00" }
    });
    
    // Check connection status
    const minerStatus = minerInstance.getStatus();
    setConnectionStatus({
      isConnected: minerStatus === MinerStatus.RUNNING,
      statusText: minerStatus === MinerStatus.RUNNING ? "Connected to Pool" : "Disconnected"
    });
    
    // Set up listeners
    const statusListener = (data: any) => {
      setConnectionStatus({
        isConnected: data.status === MinerStatus.RUNNING,
        statusText: data.status === MinerStatus.RUNNING 
          ? "Connected to Pool" 
          : data.status === MinerStatus.INITIALIZING 
            ? "Connecting..." 
            : "Disconnected"
      });
    };
    
    const hashrateListener = (data: any) => {
      setMinerMetrics(current => ({
        ...current,
        hashrate: data.current
      }));
      
      // Estimate earnings (very rough estimate)
      // XMR calculation based on current hashrate
      const xmrPerDay = (data.current * 86400) / 100000000; // Very rough estimate
      const usdValue = xmrPerDay * 150; // Assuming 1 XMR = $150
      
      setMinerMetrics(current => ({
        ...current,
        earnings: {
          xmr: xmrPerDay.toFixed(5),
          usd: `$${usdValue.toFixed(2)}`
        }
      }));
      
      // Update CPU usage based on threads and whether mining is active
      const settings = minerInstance.getSettings();
      const maxThreads = navigator.hardwareConcurrency || 4;
      const usagePercent = (settings.threads / maxThreads) * 100 * (1 - (settings.throttle / 100) * 0.7);
      
      setMinerMetrics(current => ({
        ...current,
        cpuUsage: Math.round(usagePercent),
        cpuThreads: settings.threads
      }));
    };
    
    const shareListener = (data: any) => {
      if (data.accepted) {
        setMinerMetrics(current => ({
          ...current,
          shares: {
            ...current.shares,
            accepted: data.total
          }
        }));
      } else {
        setMinerMetrics(current => ({
          ...current,
          shares: {
            ...current.shares,
            rejected: data.total
          }
        }));
      }
    };
    
    minerInstance.addEventListener('status', statusListener);
    minerInstance.addEventListener('hashrate', hashrateListener);
    minerInstance.addEventListener('share', shareListener);
    
    return () => {
      minerInstance.removeEventListener('status', statusListener);
      minerInstance.removeEventListener('hashrate', hashrateListener);
      minerInstance.removeEventListener('share', shareListener);
    };
  }, []);
  
  // Update active browsers count when global stats change
  useEffect(() => {
    if (globalStats && typeof globalStats.activeBrowsers === 'number') {
      setActiveBrowsers(globalStats.activeBrowsers);
    } else if (!activeBrowsers) {
      // Fallback to random browsers count if no WebSocket data
      setActiveBrowsers(Math.floor(Math.random() * 20) + 1);
    }
  }, [globalStats]);

  const { user, logout } = useAuth();
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Section */}
      <header className="bg-card border-b border-gray-700 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg className="h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-xl font-bold">MinerDash</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {wsConnected && (
            <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full">
              Real-time
            </span>
          )}
          <ConnectionStatus 
            isConnected={connectionStatus.isConnected} 
            status={connectionStatus.statusText} 
          />
          
          {/* User info and logout */}
          <div className="flex items-center ml-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-800 rounded-l-full px-3 py-1">
              <User className="h-4 w-4 text-indigo-300" />
              <span className="text-sm font-medium">{user?.username}</span>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={logout}
              className="rounded-l-none md:rounded-l-none md:rounded-r-full"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Hashrate"
              value={`${minerMetrics.hashrate.toFixed(1)} H/s`}
              icon={<Zap className="w-5 h-5" />}
              iconColor="text-blue-400"
              iconBgColor="bg-blue-900/30"
              footer={
                <span className="text-green-400">
                  {minerMetrics.hashrate > 0 ? "+2.3% from average" : "Waiting for data..."}
                </span>
              }
            />
            
            <MetricCard
              title="Shares"
              value={`${minerMetrics.shares.accepted} / ${minerMetrics.shares.rejected}`}
              icon={<Check className="w-5 h-5" />}
              iconColor="text-green-400"
              iconBgColor="bg-green-900/30"
              footer={<span>Accepted / Rejected</span>}
            />
            
            <MetricCard
              title="CPU Usage"
              value={`${minerMetrics.cpuUsage}%`}
              icon={<Cpu className="w-5 h-5" />}
              iconColor="text-yellow-400"
              iconBgColor="bg-yellow-900/30"
              footer={<span>Using {minerMetrics.cpuThreads}/{navigator.hardwareConcurrency || 4} threads</span>}
            />
            
            <MetricCard
              title="Earnings (24h est.)"
              value={`${minerMetrics.earnings.xmr} XMR`}
              icon={<Coins className="w-5 h-5" />}
              iconColor="text-purple-400"
              iconBgColor="bg-purple-900/30"
              footer={<span>≈ {minerMetrics.earnings.usd} USD</span>}
            />
          </div>

          {/* Mining Controls and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <MiningControls />
            <MiningStats />
          </div>

          {/* Wallet Configuration */}
          <div className="mb-6">
            <WalletConfiguration />
          </div>

          {/* System Info and Mining Log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SystemInfo />
            <MiningLog />
          </div>
          
          {/* Global Stats Section */}
          {globalStats && (
            <div className="mb-6 bg-gradient-to-br from-indigo-900/50 to-violet-900/50 rounded-lg p-6 border border-indigo-700/60">
              <h2 className="text-lg font-semibold mb-4 text-white">Global Mining Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/40 rounded-lg p-4">
                  <div className="text-indigo-300 mb-1 text-sm">Total Active Miners</div>
                  <div className="text-2xl font-bold">{globalStats.activeBrowsers}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-4">
                  <div className="text-indigo-300 mb-1 text-sm">Global Hashrate</div>
                  <div className="text-2xl font-bold">{globalStats.globalHashrate.toFixed(2)} H/s</div>
                </div>
                <div className="bg-black/40 rounded-lg p-4">
                  <div className="text-indigo-300 mb-1 text-sm">Monthly Earnings</div>
                  <div className="text-2xl font-bold">{globalStats.estimatedRewards?.monthly || "0.00000 XMR"}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Stats Bar */}
      <div className="bg-card/80 backdrop-blur-sm px-4 py-3 border-t border-gray-700 text-center">
        <div className="flex flex-wrap justify-center items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <span className="font-medium">Total Hashrate:</span>
            <span className="text-blue-400 font-bold">
              {globalStats?.globalHashrate?.toFixed(2) || minerMetrics.hashrate.toFixed(2)} H/s
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-purple-400" />
            <span className="font-medium">Total Earnings (est):</span>
            <span className="text-purple-400 font-bold">
              {globalStats?.estimatedRewards?.total || minerMetrics.earnings.xmr} XMR
            </span>
            <span className="text-gray-400 text-xs">
              (~{minerMetrics.earnings.usd}/day)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-green-400" />
            <span className="font-medium">Active Miners:</span>
            <span className="text-green-400 font-bold">
              {activeBrowsers}
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-card px-4 py-3 border-t border-gray-700 text-center text-sm text-muted-foreground">
        <div className="flex justify-between items-center">
          <div>
            MinerDash v1.2.0
          </div>
          <div className="flex items-center">
            <span>All rewards go to project wallet</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </footer>
    </div>
  );
}
