import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { minerInstance, LogEntry, LogType } from "@/lib/miner";

export function MiningLog() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize logs
    setLogs(minerInstance.getLogs());
    
    // Subscribe to log updates
    const logListener = (entry: LogEntry) => {
      setLogs(currentLogs => [entry, ...currentLogs].slice(0, 100));
    };
    
    minerInstance.addEventListener('log', logListener);
    
    return () => {
      minerInstance.removeEventListener('log', logListener);
    };
  }, []);

  const clearLog = () => {
    minerInstance.clearLogs();
    setLogs([]);
  };

  const exportLog = () => {
    try {
      // Create log text
      const logText = logs.map(entry => {
        const time = entry.timestamp.toTimeString().split(' ')[0];
        return `[${time}] ${entry.message}`;
      }).join('\n');
      
      // Create blob and download
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mining-log-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Log Exported",
        description: "Mining log has been exported successfully"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Could not export log: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const getLogTypeClass = (type: LogType) => {
    switch (type) {
      case LogType.SUCCESS:
        return "text-green-400";
      case LogType.WARNING:
        return "text-yellow-400";
      case LogType.ERROR:
        return "text-red-400";
      case LogType.INFO:
      default:
        return "";
    }
  };

  return (
    <Card className="border border-gray-700 shadow-lg">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">Mining Log</h2>
        
        <div 
          ref={logContainerRef} 
          className="bg-black/50 rounded-md h-64 overflow-y-auto p-4 font-mono text-xs"
        >
          <div className="space-y-2">
            {logs.map((entry, index) => (
              <div key={index} className="log-entry">
                <span className="text-gray-500">
                  [{entry.timestamp.toTimeString().split(' ')[0]}]
                </span>
                <span className={`ml-2 ${getLogTypeClass(entry.type)}`}>
                  {entry.message}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                No log entries yet
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={clearLog}
          >
            Clear Log
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={exportLog}
          >
            Export Log
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
