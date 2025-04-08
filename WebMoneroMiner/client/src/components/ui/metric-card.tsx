import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconColor: string;
  iconBgColor: string;
  footer?: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  iconColor,
  iconBgColor,
  footer,
  className,
}: MetricCardProps) {
  return (
    <Card className={`border border-gray-700 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
            <p className="mt-1 text-2xl font-mono font-semibold">{value}</p>
          </div>
          <div className={`p-2 rounded-md ${iconBgColor} ${iconColor}`}>
            {icon}
          </div>
        </div>
        {footer && (
          <div className="mt-2 text-xs text-muted-foreground">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
