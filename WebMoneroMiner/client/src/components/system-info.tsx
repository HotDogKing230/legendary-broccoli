import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { minerInstance } from "@/lib/miner";
import { Progress } from "@/components/ui/progress";

// Get browser information
function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "";
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
    browserVersion = userAgent.match(/chrome\/([0-9.]+)/i)?.[1] || "";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
    browserVersion = userAgent.match(/firefox\/([0-9.]+)/i)?.[1] || "";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
    browserVersion = userAgent.match(/version\/([0-9.]+)/i)?.[1] || "";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
    browserVersion = userAgent.match(/opr\/([0-9.]+)/i)?.[1] || "";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
    browserVersion = userAgent.match(/edg\/([0-9.]+)/i)?.[1] || "";
  }
  
  return `${browserName} ${browserVersion}`;
}

// Get platform information
function getPlatformInfo() {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  
  if (/Win/.test(platform)) {
    if (/Windows NT 10.0/.test(userAgent)) return "Windows 10";
    if (/Windows NT 6.3/.test(userAgent)) return "Windows 8.1";
    if (/Windows NT 6.2/.test(userAgent)) return "Windows 8";
    if (/Windows NT 6.1/.test(userAgent)) return "Windows 7";
    return "Windows";
  }
  
  if (/Mac/.test(platform)) return "macOS";
  if (/Linux/.test(platform)) return "Linux";
  if (/Android/.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
  
  return platform;
}

// Check WebAssembly support
function isWasmSupported() {
  try {
    if (typeof WebAssembly === 'object' &&
        typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0
      ]));
      if (module instanceof WebAssembly.Module) {
        const instance = new WebAssembly.Instance(module);
        return instance instanceof WebAssembly.Instance;
      }
    }
  } catch (e) {}
  return false;
}

export function SystemInfo() {
  const [cpuLoad, setCpuLoad] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState("Unknown");
  const [memoryPercent, setMemoryPercent] = useState(0);
  const [cpuTemperature, setCpuTemperature] = useState(0);
  const [systemInfo, setSystemInfo] = useState({
    browser: getBrowserInfo(),
    platform: getPlatformInfo(),
    wasm: isWasmSupported() ? "Supported" : "Not supported"
  });
  
  useEffect(() => {
    // Update CPU load based on miner activity
    const hashrateListener = (data: any) => {
      // Simulate CPU load based on threads and throttle
      const threads = minerInstance.getSettings().threads;
      const throttle = minerInstance.getSettings().throttle;
      const maxThreads = navigator.hardwareConcurrency || 4;
      
      // Calculate an estimated CPU load
      const baseLoad = (threads / maxThreads) * 100;
      const adjustedLoad = baseLoad * (1 - (throttle / 100) * 0.7); // Throttle has partial effect
      
      setCpuLoad(Math.min(100, adjustedLoad));
      
      // Simulate temperature based on load (just for UI display)
      setCpuTemperature(Math.min(90, 40 + (adjustedLoad / 2)));
    };
    
    minerInstance.addEventListener('hashrate', hashrateListener);
    
    // Get memory info if available
    if (navigator.deviceMemory) {
      // Memory in GB
      const totalMemory = navigator.deviceMemory;
      // Simulate used memory - in real app would use performance.memory
      const usedMemory = Math.random() * 1.5;
      setMemoryUsage(`${usedMemory.toFixed(1)}/${totalMemory.toFixed(1)} GB`);
      setMemoryPercent((usedMemory / totalMemory) * 100);
    } else {
      setMemoryUsage("1.2/8.0 GB"); // Fallback
      setMemoryPercent(15);
    }
    
    return () => {
      minerInstance.removeEventListener('hashrate', hashrateListener);
    };
  }, []);

  return (
    <Card className="border border-gray-700 shadow-lg">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">System Performance</h2>
        
        <div className="space-y-4">
          {/* CPU Performance */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">CPU Load</span>
              <span className="text-sm font-mono">{cpuLoad.toFixed(0)}%</span>
            </div>
            <Progress value={cpuLoad} className="h-2" />
          </div>
          
          {/* Memory Usage */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">Memory Usage</span>
              <span className="text-sm font-mono">{memoryUsage}</span>
            </div>
            <Progress value={memoryPercent} className="h-2" />
          </div>
          
          {/* Temperature */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-muted-foreground">CPU Temperature</span>
              <span className="text-sm font-mono">{cpuTemperature.toFixed(0)}°C</span>
            </div>
            <Progress 
              value={cpuTemperature} 
              max={100}
              className={`h-2 ${
                cpuTemperature > 80 
                  ? 'bg-red-500' 
                  : cpuTemperature > 65 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`} 
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Browser Information</h3>
          <div className="bg-black/50 p-3 rounded-md text-sm font-mono">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Browser:</span>
                <span>{systemInfo.browser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform:</span>
                <span>{systemInfo.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WebAssembly:</span>
                <span className={systemInfo.wasm === "Supported" ? "text-green-400" : "text-red-400"}>
                  {systemInfo.wasm}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
