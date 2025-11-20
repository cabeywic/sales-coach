"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { ChatInterfaceWithOpenAI } from "@/components/chat/ChatInterfaceWithOpenAI";
import { PerformanceCard } from "@/components/insights/PerformanceCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { classifyPerformance, compareWithPreviousRecords } from "@/lib/agents/insights-engine";
import { DSRInfo } from "@/types";
import { TrendingUp, TrendingDown, Target, Award, History } from "lucide-react";

export default function CoachingPage() {
  const { currentDSR, dsrHistory } = useStore();
  const [historicalComparison, setHistoricalComparison] = useState<ReturnType<typeof compareWithPreviousRecords> | null>(null);

  useEffect(() => {
    if (currentDSR && dsrHistory.length > 0) {
      const comparison = compareWithPreviousRecords(dsrHistory[0] as DSRInfo, dsrHistory);
      setHistoricalComparison(comparison);
    }
  }, [currentDSR, dsrHistory]);

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

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="border-b p-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">Coaching Mode</h1>
        <p className="text-sm text-muted-foreground">
          Personalized development and performance improvement
        </p>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-4 flex-shrink-0">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
          <ChatInterfaceWithOpenAI
            mode="coaching"
            placeholder="Ask about your performance, goals, or improvement strategies..."
          />
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 overflow-auto p-4">
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Performance Status */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Status</CardTitle>
                <CardDescription>
                  Overall assessment: <span className="font-semibold capitalize">{performance.status.replace("-", " ")}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
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
                    title="Route Efficiency"
                    value={`${currentDSR.route_efficiency_score.toFixed(0)}/100`}
                    status={currentDSR.route_efficiency_score >= 80 ? "good" : "needs-attention"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Development Areas */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-green-900 dark:text-green-100">
                      Strength Areas
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    {currentDSR.strength_areas}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Leverage this strength to build deeper customer relationships and mentor peers.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-900 dark:text-blue-100">
                      Development Focus
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800 dark:text-blue-200 font-medium">
                    {currentDSR.development_areas}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    Let's create a focused action plan to improve in this area.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {performance.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{rec}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Historical Comparison */}
            {historicalComparison && dsrHistory.length > 1 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <CardTitle>Performance Trends</CardTitle>
                  </div>
                  <CardDescription>
                    Comparing with previous records ({dsrHistory.length} total records)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Target Achievement Trend</span>
                      <Badge
                        variant={
                          historicalComparison.targetAchievementTrend === "improving"
                            ? "default"
                            : historicalComparison.targetAchievementTrend === "declining"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {historicalComparison.targetAchievementTrend}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Sales Growth Momentum</span>
                      <Badge
                        variant={
                          historicalComparison.salesGrowthTrend === "improving"
                            ? "default"
                            : historicalComparison.salesGrowthTrend === "declining"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {historicalComparison.salesGrowthTrend}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Route Efficiency Trend</span>
                      <Badge
                        variant={
                          historicalComparison.routeEfficiencyTrend === "improving"
                            ? "default"
                            : historicalComparison.routeEfficiencyTrend === "declining"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {historicalComparison.routeEfficiencyTrend}
                      </Badge>
                    </div>

                    {historicalComparison.insights.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Key Insights:</p>
                        <ul className="space-y-2">
                          {historicalComparison.insights.map((insight, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Current Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {salesGrowth > 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">Sales Trend</span>
                    </div>
                    <span className={salesGrowth > 0 ? "text-green-600" : "text-red-600"}>
                      {salesGrowth > 0 ? "+" : ""}{salesGrowth}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Response Rate</span>
                    <span className="text-green-600">{currentDSR.response_rate_to_coach}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Best Performance Day</span>
                    <span>{currentDSR.day_of_week_performance}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
