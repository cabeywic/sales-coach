"use client";

import { Outlet } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Calendar, TrendingUp } from "lucide-react";

interface OutletCardProps {
  outlet: Outlet;
  onSelect?: (outlet: Outlet) => void;
  showPriority?: boolean;
}

export function OutletCard({ outlet, onSelect, showPriority }: OutletCardProps) {
  const daysSinceVisit = Math.floor(
    (new Date().getTime() - new Date(outlet.last_visit_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const getTypeColor = (type: Outlet["type"]) => {
    switch (type) {
      case "Eatery":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "SMMT":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      case "Non-Eatery":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    }
  };

  const getPriorityBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 70)
      return <Badge className="bg-red-500">High Priority</Badge>;
    if (score >= 40)
      return <Badge className="bg-yellow-500">Medium Priority</Badge>;
    return <Badge className="bg-gray-500">Low Priority</Badge>;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{outlet.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {outlet.owner_name}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={getTypeColor(outlet.type)}>{outlet.type}</Badge>
            {showPriority && getPriorityBadge(outlet.priority_score)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{daysSinceVisit}d ago</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>LKR {outlet.avg_order_value.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Relationship: {outlet.relationship_score}/10</span>
          <span className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
            <span
              className="h-full bg-primary block"
              style={{ width: `${outlet.relationship_score * 10}%` }}
            />
          </span>
        </div>

        {outlet.notes && outlet.notes.length > 0 && (
          <div className="text-xs text-muted-foreground italic">
            "{outlet.notes[0]}"
          </div>
        )}

        {onSelect && (
          <Button
            onClick={() => onSelect(outlet)}
            size="sm"
            className="w-full mt-2"
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
