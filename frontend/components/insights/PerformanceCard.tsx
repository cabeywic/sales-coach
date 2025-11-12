"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceCardProps {
  title: string;
  value: string | number;
  trend?: number;
  status?: "excellent" | "good" | "needs-attention" | "critical";
  subtitle?: string;
}

export function PerformanceCard({
  title,
  value,
  trend,
  status,
  subtitle,
}: PerformanceCardProps) {
  const statusColors = {
    excellent: "bg-green-500/10 text-green-700 border-green-500/20",
    good: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    "needs-attention": "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    critical: "bg-red-500/10 text-red-700 border-red-500/20",
  };

  const getTrendIcon = () => {
    if (!trend) return <Minus className="h-3 w-3" />;
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    return <TrendingDown className="h-3 w-3 text-red-600" />;
  };

  return (
    <Card className={cn(status && statusColors[status])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span
              className={cn(
                "text-xs font-medium",
                trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
              )}
            >
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
