import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { minerInstance } from "@/lib/miner";
import { HashRateChart } from "@/components/hashrate-chart";

interface StatsItem {
  label: string;
  value: string;
}

export function MiningStats() {
  const [hashrate, setHashrate] = useState(0);
  const [hashrateHistory, setHashrateHistory] = useState<number[]>([]);
  const [sessionStats, setSessionStats] = useState<StatsItem[]>([
    { label: "Time", value: "00:00:00" },
    { label: "Total Hashes", value: "0" },
    { label: "Avg. Hashrate", value: "0 H/s" }
  ]);
  const [networkStats, setNetworkStats] = useState<StatsItem[]>([
    { label: "Pool", value: "supportXMR" },
    { label: "Difficulty", value: "110,356" },
    { label: "Ping", value: "45ms" }
  ]);

  useEffect(() => {
    // Update initial states
    const stats = minerInstance.getStats();
    setHashrate(stats.hashrate);
    setHashrateHistory(minerInstance.getHashrateHistory());
    
    // Subscribe to hashrate updates
    const hashrateListener = (data: any) => {
      setHashrate(data.current);
      setHashrateHistory(data.history);
      
      // Update session stats
      const hours = Math.floor(data.sessionTime / 3600);
      const minutes = Math.floor((data.sessionTime % 3600) / 60);
      const seconds = data.sessionTime % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Calculate average hashrate
      const avgHashrate = data.sessionTime > 0
        ? (data.total / data.sessionTime).toFixed(1)
        : "0.0";
      
      // Format total hashes with commas
      const formattedHashes = data.total.toLocaleString();
      
      setSessionStats([
        { label: "Time", value: timeString },
        { label: "Total Hashes", value: formattedHashes },
        { label: "Avg. Hashrate", value: `${avgHashrate} H/s` }
      ]);
    };
    
    minerInstance.addEventListener('hashrate', hashrateListener);
    
    // Get pool info
    const settings = minerInstance.getSettings();
    const poolName = settings.poolUrl.split(':')[0] || 'Unknown';
    
    setNetworkStats([
      { label: "Pool", value: poolName },
      { label: "Difficulty", value: "110,356" }, // This would be dynamic in a full implementation
      { label: "Ping", value: "45ms" } // This would be dynamic in a full implementation
    ]);
    
    return () => {
      minerInstance.removeEventListener('hashrate', hashrateListener);
    };
  }, []);

  return (
    <Card className="border border-gray-700 shadow-lg col-span-1 lg:col-span-2">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">Real-Time Performance</h2>
        
        {/* Performance Graph */}
        <div className="bg-black/50 rounded-md p-3 mb-4">
          <HashRateChart 
            data={hashrateHistory} 
            currentHashrate={hashrate} 
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Session Stats</h3>
            <div className="space-y-2 font-mono">
              {sessionStats.map((stat, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{stat.label}:</span>
                  <span>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Network Info</h3>
            <div className="space-y-2 font-mono">
              {networkStats.map((stat, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{stat.label}:</span>
                  <span>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
