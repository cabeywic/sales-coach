"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { ChatInterfaceWithOpenAI } from "@/components/chat/ChatInterfaceWithOpenAI";
import { OutletCard } from "@/components/insights/OutletCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPriorityOutlets, generateOutletIntelligence } from "@/lib/agents/insights-engine";
import { Outlet, Message } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CheckInPage() {
  const { currentDSR, outlets, selectedPersona, addMessage } = useStore();
  const [priorityOutlets, setPriorityOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [showOutletDialog, setShowOutletDialog] = useState(false);

  useEffect(() => {
    if (currentDSR) {
      const priorities = getPriorityOutlets(currentDSR, outlets);
      setPriorityOutlets(priorities);
    }
  }, [currentDSR, outlets]);

  const handleOutletSelect = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setShowOutletDialog(true);
  };

  if (!currentDSR) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="border-b p-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">Check-In Mode</h1>
        <p className="text-sm text-muted-foreground">Real-time support for your field work</p>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-4 flex-shrink-0">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="outlets">Priority Outlets</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
          <ChatInterfaceWithOpenAI mode="checkin" placeholder="Ask about your day or any questions you have..."/>
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
