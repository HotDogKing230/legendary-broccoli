import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Edit, Check } from "lucide-react";
import { minerInstance } from "@/lib/miner";
import { getPoolById, miningPools } from "@/lib/pools";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function WalletConfiguration() {
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [miningRewards, setMiningRewards] = useState({
    totalMined: "0.00362 XMR",
    unpaidBalance: "0.00089 XMR",
    lastPayout: "2023-06-12"
  });

  useEffect(() => {
    // Get wallet address from miner
    const settings = minerInstance.getSettings();
    setWalletAddress(settings.walletAddress);
    
    // Try to determine the selected pool
    const poolUrlParts = settings.poolUrl.split(':');
    if (poolUrlParts.length >= 1) {
      const poolHost = poolUrlParts[0];
      const foundPool = miningPools.find(p => p.url === poolHost);
      if (foundPool) {
        setSelectedPoolId(foundPool.id);
      }
    }
  }, []);

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard"
    });
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // If we're closing editing mode, restore the original address
    if (isEditing) {
      const settings = minerInstance.getSettings();
      setWalletAddress(settings.walletAddress);
    }
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    setWalletAddress(e.currentTarget.textContent || "");
  };

  const saveWalletAddress = async () => {
    try {
      // Validate the address (basic validation)
      if (walletAddress.length < 95) {
        toast({
          title: "Invalid Address",
          description: "Please enter a valid Monero wallet address",
          variant: "destructive"
        });
        return;
      }
      
      // Update the settings
      await minerInstance.applySettings({
        walletAddress
      });
      
      setIsEditing(false);
      toast({
        title: "Note",
        description: "All mining rewards always go to the project wallet",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update wallet: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const handlePoolChange = async (poolId: string) => {
    try {
      setSelectedPoolId(poolId);
      
      const pool = getPoolById(poolId);
      if (pool) {
        await minerInstance.applySettings({
          poolUrl: `${pool.url}:${pool.port}`
        });
        
        toast({
          title: "Pool Updated",
          description: `Now mining with ${pool.name}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update pool: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border border-gray-700 shadow-lg">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Project Wallet Configuration</h2>
        
        <Alert variant="default" className="mb-4 bg-gradient-to-r from-indigo-900/70 to-purple-900/70 border border-indigo-500/50">
          <AlertDescription className="font-medium">
            <strong>🔒 Important:</strong> All mining rewards from all browsers are sent to this single project wallet address. The wallet below cannot be changed and is hard-coded for security.
          </AlertDescription>
        </Alert>
        
        <div className="bg-black/50 rounded-md p-4 border border-purple-800/40 mb-4">
          <div className="mb-2 text-xs text-indigo-300 uppercase font-semibold">Project Wallet Address</div>
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm text-gray-300 truncate overflow-auto max-w-full">
              {walletAddress}
            </div>
            <div className="flex-shrink-0 flex space-x-2 ml-2">
              <Button 
                size="icon" 
                variant="secondary" 
                onClick={copyWalletAddress}
                title="Copy Wallet Address"
              >
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Mining Rewards</h3>
            <div className="bg-black/50 rounded-md p-4 border border-gray-700">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Total Mined:</span>
                <span className="font-mono">{miningRewards.totalMined}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Unpaid Balance:</span>
                <span className="font-mono">{miningRewards.unpaidBalance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Payout:</span>
                <span className="font-mono">{miningRewards.lastPayout}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Pool Settings</h3>
            <div className="bg-black/50 rounded-md p-4 border border-gray-700">
              <div className="mb-4">
                <label htmlFor="pool-select" className="block text-muted-foreground mb-2">Mining Pool:</label>
                <Select value={selectedPoolId} onValueChange={handlePoolChange}>
                  <SelectTrigger id="pool-select" className="w-full">
                    <SelectValue placeholder="Select pool" />
                  </SelectTrigger>
                  <SelectContent>
                    {miningPools.map(pool => (
                      <SelectItem key={pool.id} value={pool.id}>
                        {pool.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="default" size="sm" onClick={() => minerInstance.applySettings({})}>
                  Apply Changes
                </Button>
                <Button variant="secondary" size="sm" onClick={() => {
                  // Reset to default settings
                  const settings = minerInstance.getSettings();
                  setWalletAddress(settings.walletAddress);
                  
                  const poolUrlParts = settings.poolUrl.split(':');
                  if (poolUrlParts.length >= 1) {
                    const poolHost = poolUrlParts[0];
                    const foundPool = miningPools.find(p => p.url === poolHost);
                    if (foundPool) {
                      setSelectedPoolId(foundPool.id);
                    }
                  }
                }}>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
