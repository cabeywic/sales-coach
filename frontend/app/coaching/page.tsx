"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { ChatInterfaceWithOpenAI } from "@/components/chat/ChatInterfaceWithOpenAI";
import { PerformanceCard } from "@/components/insights/PerformanceCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { classifyPerformance } from "@/lib/agents/insights-engine";
import { Message } from "@/types";
import { useVoice } from "@/hooks/useVoice";
import { TrendingUp, TrendingDown, Target, Award } from "lucide-react";

export default function CoachingPage() {
  const { currentDSR, selectedPersona, addMessage, coachingConversation } = useStore();
  const { speak } = useVoice();
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    if (currentDSR) {
      // Only send initial greeting if this is a new session (empty conversation)
      if (coachingConversation.length === 0 && !hasGreetedRef.current) {
        hasGreetedRef.current = true;
        const performance = classifyPerformance(currentDSR);
        let greeting = "";

        switch (selectedPersona) {
          case "professional":
            greeting = `Let's analyze your performance. You're at ${currentDSR.target_achievement} target achievement with ${currentDSR.sales_growth_trend} growth. Your development focus area is ${currentDSR.development_areas}.`;
            break;
          case "friendly":
            greeting = `Hey! Great to see you here. You're doing well at ${currentDSR.target_achievement}, and I think we can push that even higher. Want to work on your ${currentDSR.development_areas}?`;
            break;
          case "motivator":
            greeting = `YES! You're at ${currentDSR.target_achievement} - that's solid! But I KNOW you can hit 120%+! Let's crush your ${currentDSR.development_areas} goals together!`;
            break;
          case "advisor":
            greeting = `Welcome. Looking at your ${currentDSR.target_achievement} achievement and ${currentDSR.sales_growth_trend} growth trajectory, I see strategic opportunities. Let's focus on ${currentDSR.development_areas}.`;
            break;
        }

        const greetingMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: greeting,
          timestamp: new Date(),
          metadata: { mode: "coaching", persona: selectedPersona },
        };
        addMessage(greetingMessage);
        speak(greeting);
      }
    }
  }, [currentDSR, selectedPersona, addMessage, speak]);

  const handleSendMessage = (message: string) => {
    if (!currentDSR) return;

    let response = "";
    const performance = classifyPerformance(currentDSR);

    if (message.toLowerCase().includes("perform") || message.toLowerCase().includes("doing")) {
      response = `Your current performance is ${performance.status}. You're at ${currentDSR.target_achievement} target achievement with ${currentDSR.sales_growth_trend} growth trend. ${performance.recommendations[0]}`;
    } else if (message.toLowerCase().includes("improve") || message.toLowerCase().includes("better")) {
      response = `Based on your data, I recommend: ${performance.recommendations.join(" ")} Your strength is ${currentDSR.strength_areas}, so leverage that while working on ${currentDSR.development_areas}.`;
    } else if (message.toLowerCase().includes("route") || message.toLowerCase().includes("efficiency")) {
      response = `Your route efficiency is at ${currentDSR.route_efficiency_score.toFixed(0)}/100. To improve: 1) Cluster outlets by geography, 2) Visit based on preferred times, 3) Plan your route the night before. This could save you 2-3 hours per week!`;
    } else if (message.toLowerCase().includes("goal") || message.toLowerCase().includes("target")) {
      const currentAchievement = parseFloat(currentDSR.target_achievement.replace("%", ""));
      const nextTarget = Math.ceil(currentAchievement / 10) * 10 + 10;
      response = `You're at ${currentDSR.target_achievement}. Let's set a goal for ${nextTarget}% this month. To get there: increase outlet visits by 10%, focus on high-value accounts, and push ${currentDSR.current_festive_season} SKUs.`;
    } else if (message.toLowerCase().includes("strength") || message.toLowerCase().includes("good at")) {
      response = `Your strength area is ${currentDSR.strength_areas}! That's excellent. You can leverage this by mentoring other DSRs and using it to build even stronger customer relationships.`;
    } else {
      response = `I'm here to help you improve your performance. Would you like to discuss your target achievement, route efficiency, goal setting, or strategies to leverage your ${currentDSR.strength_areas} strength?`;
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
      metadata: { mode: "coaching", persona: selectedPersona },
    };

    addMessage(assistantMessage);
    speak(response);
  };

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
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Coaching Mode</h1>
        <p className="text-sm text-muted-foreground">
          Personalized development and performance improvement
        </p>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0">
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

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
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
