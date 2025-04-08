import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MinerStatus, minerInstance } from "@/lib/miner";
import { getDefaultPool, getPoolById, getPoolConnectionString, miningPools } from "@/lib/pools";
import { PauseCircle, PlayCircle, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MiningControls() {
  const { toast } = useToast();
  const [status, setStatus] = useState<MinerStatus>(MinerStatus.IDLE);
  const [threads, setThreads] = useState(navigator.hardwareConcurrency || 4);
  const [throttle, setThrottle] = useState(20);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState(getDefaultPool().id);
  const [customPoolUrl, setCustomPoolUrl] = useState("");
  const [useCustomPool, setUseCustomPool] = useState(false);

  // Initialize from miner settings
  useEffect(() => {
    const settings = minerInstance.getSettings();
    setThreads(settings.threads);
    setThrottle(settings.throttle);
    
    // Try to find the pool in our list, or set to custom
    const poolUrlParts = settings.poolUrl.split(':');
    if (poolUrlParts.length >= 1) {
      const poolHost = poolUrlParts[0];
      const foundPool = miningPools.find(p => p.url === poolHost);
      if (foundPool) {
        setSelectedPoolId(foundPool.id);
        setUseCustomPool(false);
      } else {
        setUseCustomPool(true);
        setCustomPoolUrl(settings.poolUrl);
      }
    }
    
    // Subscribe to status updates
    minerInstance.addEventListener('status', (data) => {
      setStatus(data.status);
    });
    
    // Check current status
    setStatus(minerInstance.getStatus());
  }, []);

  const toggleMining = async () => {
    try {
      if (status === MinerStatus.RUNNING) {
        await minerInstance.stop();
      } else {
        await minerInstance.start();
      }
    } catch (error) {
      toast({
        title: "Mining Error",
        description: `Failed to ${status === MinerStatus.RUNNING ? 'stop' : 'start'} mining: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handleThreadChange = (value: number[]) => {
    const threadCount = value[0];
    setThreads(threadCount);
    minerInstance.setThreads(threadCount);
  };

  const handleThrottleChange = (value: number[]) => {
    const throttleValue = value[0];
    setThrottle(throttleValue);
    minerInstance.setThrottle(throttleValue);
  };

  const handlePoolChange = (poolId: string) => {
    setSelectedPoolId(poolId);
    
    // If mining is active, confirm the change
    if (status === MinerStatus.RUNNING) {
      const pool = getPoolById(poolId);
      if (pool) {
        toast({
          title: "Changing Pool",
          description: `The miner will restart to connect to ${pool.name}`,
        });
      }
    }
    
    // Apply the pool change
    const pool = getPoolById(poolId);
    if (pool) {
      minerInstance.setPool(getPoolConnectionString(pool));
    }
  };

  const handleCustomPoolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPoolUrl(e.target.value);
  };

  const applyCustomPool = () => {
    if (customPoolUrl.trim()) {
      minerInstance.setPool(customPoolUrl.trim());
      toast({
        title: "Custom Pool Applied",
        description: `The miner will connect to ${customPoolUrl}`,
      });
    }
  };

  const toggleCustomPool = (checked: boolean) => {
    setUseCustomPool(checked);
    if (!checked) {
      // Switch back to selected pool
      const pool = getPoolById(selectedPoolId);
      if (pool) {
        minerInstance.setPool(getPoolConnectionString(pool));
      }
    }
  };

  return (
    <Card className="border border-gray-700 shadow-lg">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">Mining Controls</h2>
        
        {/* Start/Stop Mining */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Mining Status</span>
            <span className={`text-sm font-medium ${
              status === MinerStatus.RUNNING 
                ? 'text-green-400' 
                : status === MinerStatus.ERROR 
                  ? 'text-red-400' 
                  : 'text-yellow-400'
            }`}>
              {status === MinerStatus.RUNNING 
                ? 'Active' 
                : status === MinerStatus.INITIALIZING 
                  ? 'Starting...' 
                  : status === MinerStatus.ERROR 
                    ? 'Error' 
                    : 'Inactive'}
            </span>
          </div>
          <Button 
            variant={status === MinerStatus.RUNNING ? "destructive" : "default"}
            className="w-full"
            onClick={toggleMining}
            disabled={status === MinerStatus.INITIALIZING}
          >
            {status === MinerStatus.RUNNING ? (
              <><PauseCircle className="w-5 h-5 mr-2" /> Stop Mining</>
            ) : (
              <><PlayCircle className="w-5 h-5 mr-2" /> Start Mining</>
            )}
          </Button>
        </div>
        
        {/* Thread Control */}
        <div className="mb-6">
          <Label htmlFor="thread-count" className="block text-muted-foreground mb-2">
            Threads: <span id="thread-display">{threads}</span>
          </Label>
          <Slider 
            id="thread-count"
            min={1} 
            max={navigator.hardwareConcurrency || 8} 
            step={1}
            value={[threads]}
            onValueChange={handleThreadChange}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span>{navigator.hardwareConcurrency || 8}</span>
          </div>
        </div>
        
        {/* Throttle Control */}
        <div className="mb-6">
          <Label htmlFor="throttle" className="block text-muted-foreground mb-2">
            Throttle: <span id="throttle-display">{throttle}%</span>
          </Label>
          <Slider 
            id="throttle"
            min={0} 
            max={100} 
            step={5}
            value={[throttle]}
            onValueChange={handleThrottleChange}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="secondary" 
              className="w-full flex items-center justify-center gap-2"
            >
              <span>Advanced Settings</span>
              {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pool-select">Mining Pool</Label>
              <Select 
                disabled={useCustomPool} 
                value={selectedPoolId} 
                onValueChange={handlePoolChange}
              >
                <SelectTrigger id="pool-select" className="w-full">
                  <SelectValue placeholder="Select pool" />
                </SelectTrigger>
                <SelectContent>
                  {miningPools.map(pool => (
                    <SelectItem key={pool.id} value={pool.id}>
                      {pool.name} ({pool.fee}% fee)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="custom-pool-switch" 
                checked={useCustomPool} 
                onCheckedChange={toggleCustomPool} 
              />
              <Label htmlFor="custom-pool-switch">Use custom pool</Label>
            </div>
            
            {useCustomPool && (
              <div className="space-y-2">
                <Label htmlFor="custom-pool">Custom Pool URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-pool"
                    placeholder="e.g. pool.domain.com:3333"
                    value={customPoolUrl}
                    onChange={handleCustomPoolChange}
                  />
                  <Button onClick={applyCustomPool}>Apply</Button>
                </div>
              </div>
            )}
            
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                <Cpu className="inline h-3 w-3 mr-1" />
                Higher thread count improves mining performance but uses more system resources.
                Throttle reduces CPU usage but also reduces mining speed.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
