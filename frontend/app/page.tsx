"use client";

import { useStore } from "@/store/useStore";
import { PerformanceCard } from "@/components/insights/PerformanceCard";
import { OutletCard } from "@/components/insights/OutletCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { classifyPerformance, getPriorityOutlets, generateMorningBriefing } from "@/lib/agents/insights-engine";
import { CheckCircle, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useVoice } from "@/hooks/useVoice";
import { Outlet } from "@/types";

export default function Home() {
  const { currentDSR, selectedPersona, outlets } = useStore();
  const { speak, voiceEnabled } = useVoice();
  const [priorityOutlets, setPriorityOutlets] = useState<Outlet[]>([]);

  useEffect(() => {
    if (currentDSR) {
      const priorities = getPriorityOutlets(currentDSR, outlets);
      setPriorityOutlets(priorities);
    }
  }, [currentDSR, outlets]);

  if (!currentDSR) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const performance = classifyPerformance(currentDSR);
  const targetAchievement = parseFloat(currentDSR.target_achievement.replace("%", ""));
  const salesGrowth = parseFloat(currentDSR.sales_growth_trend.replace("%", ""));

  const handleMorningBriefing = () => {
    const briefing = generateMorningBriefing(currentDSR, priorityOutlets, selectedPersona);
    if (voiceEnabled) {
      speak(briefing);
    }
  };

  return (
    <div className="container px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {currentDSR.dsr_name}!</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <Link href="/checkin">
          <Button className="whitespace-nowrap">
            <CheckCircle className="h-4 w-4 mr-2" />
            Start Check-In
          </Button>
        </Link>
        <Link href="/coaching">
          <Button variant="outline" className="whitespace-nowrap">
            <TrendingUp className="h-4 w-4 mr-2" />
            Coaching Session
          </Button>
        </Link>
        <Button variant="outline" onClick={handleMorningBriefing} className="whitespace-nowrap">
          Morning Briefing
        </Button>
      </div>

      {/* Performance Status Alert */}
      {performance.status === "needs-attention" || performance.status === "critical" ? (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900 dark:text-yellow-100">
                Action Needed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              {performance.recommendations[0]}
            </p>
            <Link href="/coaching">
              <Button variant="outline" size="sm">
                Get Coaching <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {/* Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PerformanceCard
            title="Target Achievement"
            value={currentDSR.target_achievement}
            trend={salesGrowth}
            status={performance.status}
          />
          <PerformanceCard
            title="Sales Growth"
            value={currentDSR.sales_growth_trend}
            trend={salesGrowth}
          />
          <PerformanceCard
            title="Outlets Visited"
            value={`${currentDSR.outlets_visited}/${currentDSR.outlets_to_sell_to}`}
            subtitle="This week"
          />
          <PerformanceCard
            title="Route Efficiency"
            value={`${currentDSR.route_efficiency_score.toFixed(0)}/100`}
            status={currentDSR.route_efficiency_score >= 80 ? "good" : "needs-attention"}
          />
        </div>
      </div>

      {/* Tabs for Outlets and Insights */}
      <Tabs defaultValue="priority" className="space-y-4">
        <TabsList>
          <TabsTrigger value="priority">Priority Outlets</TabsTrigger>
          <TabsTrigger value="missed">Missed Outlets</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="priority" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Top Priority Outlets Today</h3>
            <Link href="/checkin">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityOutlets.slice(0, 3).map((outlet) => (
              <OutletCard key={outlet.outlet_id} outlet={outlet} showPriority />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="missed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Missed Outlets</CardTitle>
              <CardDescription>
                Outlets you haven't visited recently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Week</span>
                  <span className="font-semibold">{currentDSR.outlets_missed_last_week}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Month</span>
                  <span className="font-semibold">{currentDSR.missed_outlets_last_month}</span>
                </div>
              </div>
              <Link href="/checkin">
                <Button className="w-full mt-4" size="sm">
                  View Missed Outlets
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Key Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {performance.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {currentDSR.current_festive_season && (
            <Card className="border-purple-500 bg-purple-50 dark:bg-purple-950">
              <CardHeader>
                <CardTitle className="text-purple-900 dark:text-purple-100">
                  {currentDSR.current_festive_season} Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {currentDSR.festival_season_SKUs_to_outlet} festive SKUs available.
                  Focus on eateries and premium outlets for maximum impact.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
