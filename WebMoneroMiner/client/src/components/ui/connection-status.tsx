interface ConnectionStatusProps {
  isConnected: boolean;
  status: string;
  className?: string;
}

export function ConnectionStatus({ 
  isConnected, 
  status, 
  className 
}: ConnectionStatusProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <span className={`flex items-center px-3 py-1 rounded-full text-sm ${
        isConnected 
          ? 'bg-green-900/60 text-green-200' 
          : 'bg-red-900/60 text-red-200'
      }`}>
        <span className={`h-2 w-2 rounded-full mr-2 ${
          isConnected 
            ? 'bg-green-400 animate-pulse' 
            : 'bg-red-400'
        }`}></span>
        <span>{status}</span>
      </span>
    </div>
  );
}
