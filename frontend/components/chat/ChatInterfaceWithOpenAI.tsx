"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { QuickActions } from "./QuickActions";
import { useElevenLabsAgent } from "@/hooks/useElevenLabsAgent";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ChatInterfaceProps {
  mode: "checkin" | "coaching";
  placeholder?: string;
}

export function ChatInterfaceWithOpenAI({
  mode,
  placeholder = "Ask me anything...",
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    currentConversation,
    checkinConversation,
    coachingConversation,
    addMessage,
    selectedPersona,
    voiceEnabled,
    currentDSR,
    settings,
  } = useStore();

  // Use mode-specific conversation
  const modeConversation = mode === "checkin" ? checkinConversation : coachingConversation;

  const agent = useElevenLabsAgent({
    persona: selectedPersona,
    mode,
    onMessage: (message) => {
      // Message already added to store by the hook
      // This callback is for additional processing if needed
    },
    onError: (error) => {
      console.error("[ChatInterface] Agent error:", error);
    },
    debug: process.env.NODE_ENV === "development",
  });

  const {
    connected: isConnected,
    speaking: isSpeaking,
    listening: isListening,
    error,
    isConnecting,
    connect,
    disconnect,
  } = agent;

  const isActive = isConnected;

  // Debug logging
  console.log("[ChatInterface] Current state:", {
    isConnected,
    isSpeaking,
    isListening,
    isActive,
    isConnecting,
    voiceEnabled,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [modeConversation]);

  // Toggle voice connection
  const toggle = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input;
    setInput("");

    // Text messages ALWAYS use OpenAI API (regardless of voice connection)
    // Voice conversations happen separately through the WebRTC connection
    const userMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
      metadata: { mode, persona: selectedPersona },
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...modeConversation
              .slice(-10)
              .map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
            { role: "user", content: messageText },
          ],
          mode,
          dsrData: currentDSR,
          persona: selectedPersona,
          language: settings.language, // Pass language setting for Tamil support
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        metadata: { mode, persona: selectedPersona },
      };

      addMessage(assistantMessage);
    } catch (error) {
      console.error("Failed to send message:", error);

      const errorMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        role: "assistant",
        content: settings.language === "tamil"
          ? "மன்னிக்கவும், எனக்கு இணைப்பில் சிக்கல் உள்ளது. மீண்டும் முயற்சிக்கவும்."
          : "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
        metadata: { mode, persona: selectedPersona },
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Simplified Voice Status */}
      {voiceEnabled && isActive && (
        <div className="border-b bg-muted/50 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 max-w-3xl mx-auto">
            {isSpeaking && (
              <Badge variant="default" className="animate-pulse">
                🎙️ AI Speaking...
              </Badge>
            )}
            {isListening && !isSpeaking && (
              <Badge variant="outline" className="animate-pulse">
                👂 Listening...
              </Badge>
            )}
            {!isSpeaking && !isListening && (
              <Badge variant="secondary">
                🟢 Voice Active
              </Badge>
            )}
            {error && (
              <Badge variant="destructive">
                ⚠️ {error.message || "Connection error"}
              </Badge>
            )}
            {isConnecting && (
              <Badge variant="secondary">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Connecting...
              </Badge>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {modeConversation.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg mb-2">
                {settings.language === "tamil"
                  ? mode === "checkin"
                    ? "உங்கள் நாளைத் தொடங்க தயாரா?"
                    : "உங்கள் செயல்திறனை மேம்படுத்துவோம்"
                  : mode === "checkin"
                    ? "Ready to start your day?"
                    : "Let's work on improving your performance"}
              </p>
              <p className="text-sm">
                {settings.language === "tamil"
                  ? voiceEnabled
                    ? isActive
                      ? "குரல் செயலில் உள்ளது - இயல்பாகப் பேசுங்கள்"
                      : "குரல் உரையாடலைத் தொடங்க மைக்ரோஃபோனைக் கிளிக் செய்யவும்"
                    : "கீழே உங்கள் செய்தியை தட்டச்சு செய்யவும் அல்லது விரைவு செயல்களைப் பயன்படுத்தவும்"
                  : voiceEnabled
                    ? isActive
                      ? "Voice active - speak naturally"
                      : "Click the microphone to start voice conversation"
                    : "Type your message below or use quick actions"}
              </p>
            </div>
          ) : (
            modeConversation.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {settings.language === "tamil" ? "சிந்திக்கிறது..." : "Thinking..."}
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto space-y-3">
          <QuickActions
            mode={mode}
            onActionClick={(action) => setInput(action)}
            language={settings.language}
          />

          {/* Voice toggle button - separated from text input for better layout */}
          {voiceEnabled && (
            <Button
              variant={isActive ? "default" : "outline"}
              size="lg"
              onClick={toggle}
              className={cn(
                "w-full",
                isActive && "bg-green-600 hover:bg-green-700"
              )}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isActive ? (
                <>
                  <MicOff className="h-5 w-5 mr-2" />
                  End Voice Chat
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5 mr-2" />
                  Start Voice Chat
                </>
              )}
            </Button>
          )}

          {/* Text input API - separate from voice */}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isActive
                  ? "Type message"
                  : `${placeholder}`
              }
              className="min-h-[60px] max-h-[120px] resize-none"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
