"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { ChatInterfaceWithOpenAI } from "@/components/chat/ChatInterfaceWithOpenAI";
import { OutletCard } from "@/components/insights/OutletCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPriorityOutlets, generateMorningBriefing, generateOutletIntelligence } from "@/lib/agents/insights-engine";
import { Outlet, Message } from "@/types";
import { useVoice } from "@/hooks/useVoice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CheckInPage() {
  const { currentDSR, outlets, selectedPersona, addMessage, checkinConversation } = useStore();
  const { speak } = useVoice();
  const [priorityOutlets, setPriorityOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [showOutletDialog, setShowOutletDialog] = useState(false);
  const hasGreetedRef = useRef(false);

  useEffect(() => {
    if (currentDSR) {
      const priorities = getPriorityOutlets(currentDSR, outlets);
      setPriorityOutlets(priorities);

      // Only send initial greeting if this is a new session (empty conversation)
      if (checkinConversation.length === 0 && !hasGreetedRef.current) {
        hasGreetedRef.current = true;
        const greeting = generateMorningBriefing(currentDSR, priorities, selectedPersona);
        const greetingMessage: Message = {
          id: `${Date.now()}-${Math.random()}`,
          role: "assistant",
          content: greeting,
          timestamp: new Date(),
          metadata: { mode: "checkin", persona: selectedPersona },
        };
        addMessage(greetingMessage);
        speak(greeting);
      }
    }
  }, [currentDSR, outlets, selectedPersona, addMessage, speak]);

  const handleSendMessage = (message: string) => {
    // Simple response logic for MVP
    let response = "";

    if (message.toLowerCase().includes("briefing") || message.toLowerCase().includes("overview")) {
      if (currentDSR) {
        response = generateMorningBriefing(currentDSR, priorityOutlets, selectedPersona);
      }
    } else if (message.toLowerCase().includes("priority") || message.toLowerCase().includes("outlets")) {
      response = `You have ${priorityOutlets.length} priority outlets today: ${priorityOutlets
        .slice(0, 3)
        .map((o) => o.name)
        .join(", ")}. These are selected based on visit frequency, relationship strength, and business potential.`;
    } else if (message.toLowerCase().includes("route") || message.toLowerCase().includes("plan")) {
      response = `Your route efficiency score is ${currentDSR?.route_efficiency_score.toFixed(
        0
      )}/100. I recommend clustering your visits by area. Start with Market area outlets in the morning, then move to nearby zones.`;
    } else if (message.toLowerCase().includes("festive") || message.toLowerCase().includes("christmas")) {
      response = `${currentDSR?.current_festive_season} season is here! You have ${currentDSR?.festival_season_SKUs_to_outlet} festive SKUs to promote. Focus on eateries and premium outlets for best results.`;
    } else {
      response = `I understand you're asking about "${message}". Let me help you with that. Would you like me to show you today's priority outlets, give you a route plan, or discuss festive season opportunities?`;
    }

    const assistantMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role: "assistant",
      content: response,
      timestamp: new Date(),
      metadata: { mode: "checkin", persona: selectedPersona },
    };

    addMessage(assistantMessage);
    speak(response);
  };

  const handleOutletSelect = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setShowOutletDialog(true);

    const intelligence = generateOutletIntelligence(outlet);
    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      role: "assistant",
      content: intelligence,
      timestamp: new Date(),
      metadata: { mode: "checkin", persona: selectedPersona },
    };
    addMessage(message);
    speak(`Here's what I know about ${outlet.name}`);
  };

  if (!currentDSR) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Check-In Mode</h1>
        <p className="text-sm text-muted-foreground">Real-time support for your field work</p>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="outlets">Priority Outlets</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0">
          <ChatInterfaceWithOpenAI mode="checkin" />
        </TabsContent>

        <TabsContent value="outlets" className="flex-1 overflow-auto p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Today's Priority Outlets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {priorityOutlets.length} outlets need your attention today
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {priorityOutlets.map((outlet) => (
                <OutletCard
                  key={outlet.outlet_id}
                  outlet={outlet}
                  onSelect={handleOutletSelect}
                  showPriority
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showOutletDialog} onOpenChange={setShowOutletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedOutlet?.name}</DialogTitle>
          </DialogHeader>
          {selectedOutlet && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Owner:</span> {selectedOutlet.owner_name}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedOutlet.type}
              </div>
              <div>
                <span className="font-medium">Average Order:</span> LKR{" "}
                {selectedOutlet.avg_order_value.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Relationship Score:</span>{" "}
                {selectedOutlet.relationship_score}/10
              </div>
              <div>
                <span className="font-medium">Best Visit Time:</span>{" "}
                {selectedOutlet.preferred_visit_time}
              </div>
              {selectedOutlet.notes.length > 0 && (
                <div>
                  <span className="font-medium">Notes:</span>
                  <ul className="list-disc list-inside mt-1">
                    {selectedOutlet.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
