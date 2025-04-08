import { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface HashRateChartProps {
  data: number[];
  currentHashrate: number;
}

export function HashRateChart({ data, currentHashrate }: HashRateChartProps) {
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(160);

  useEffect(() => {
    // Prepare data for the chart
    const formattedData = data.map((value, index) => {
      // Calculate time label (most recent first)
      const secondsAgo = (data.length - 1 - index) * 1;
      let timeLabel;
      
      if (secondsAgo < 60) {
        timeLabel = `${secondsAgo}s`;
      } else {
        const minutes = Math.floor(secondsAgo / 60);
        timeLabel = `${minutes}m`;
      }
      
      return {
        time: timeLabel,
        value
      };
    });
    
    setChartData(formattedData.reverse()); // Reverse to show newest on right
  }, [data]);

  // Responsive height adjustment
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setChartHeight(Math.min(160, Math.max(width * 0.3, 80)));
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  if (chartData.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="w-full h-40 flex items-center justify-center text-gray-500"
      >
        Collecting hashrate data...
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <div className="mb-1 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Hashrate over time</span>
        <span className="font-mono text-sm">{currentHashrate.toFixed(1)} H/s current</span>
      </div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            axisLine={{ stroke: '#4B5563' }}
            minTickGap={15}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            axisLine={{ stroke: '#4B5563' }}
            tickFormatter={(value) => `${value.toFixed(0)}`}
            width={25}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)} H/s`, 'Hashrate']}
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              borderColor: '#4B5563',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#8B5CF6" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: '#8B5CF6', strokeWidth: 1, fill: '#111827' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
