"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { QuickActions } from "./QuickActions";
import { useOpenAIVoice } from "@/hooks/useOpenAIVoice";
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
  } = useStore();

  // Use mode-specific conversation
  const modeConversation = mode === "checkin" ? checkinConversation : coachingConversation;

  const {
    isConnected,
    isListening,
    isSpeaking,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendTextMessage,
  } = useOpenAIVoice(mode);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [modeConversation]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      metadata: { mode, persona: selectedPersona },
    };

    addMessage(userMessage);
    const messageText = input;
    setInput("");
    setIsLoading(true);

    try {
      // If voice is connected, use voice API
      if (isConnected && voiceEnabled) {
        sendTextMessage(messageText);
      } else {
        // Otherwise use text chat API
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
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          metadata: { mode, persona: selectedPersona },
        };

        addMessage(assistantMessage);
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
        metadata: { mode, persona: selectedPersona },
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (!voiceEnabled) return;

    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  const handleMicToggle = async () => {
    if (!voiceEnabled || !isConnected) {
      await connect();
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Voice Status Bar */}
      {voiceEnabled && (
        <div className="border-b bg-muted/50 px-4 py-2">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Voice Connected" : "Voice Disconnected"}
              </Badge>
              {isSpeaking && (
                <Badge variant="outline" className="animate-pulse">
                  AI Speaking...
                </Badge>
              )}
              {isListening && (
                <Badge variant="outline" className="animate-pulse">
                  Listening...
                </Badge>
              )}
            </div>
            <Button
              variant={isConnected ? "destructive" : "default"}
              size="sm"
              onClick={handleVoiceToggle}
            >
              {isConnected ? (
                <>
                  <PhoneOff className="h-3 w-3 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <Phone className="h-3 w-3 mr-2" />
                  Connect Voice
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {modeConversation.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg mb-2">
                {mode === "checkin"
                  ? "Ready to start your day?"
                  : "Let's work on improving your performance"}
              </p>
              <p className="text-sm">
                {voiceEnabled
                  ? "Click 'Connect Voice' to start a voice conversation, or type below"
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
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <QuickActions mode={mode} onActionClick={(action) => setInput(action)} />

          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="min-h-[60px] max-h-[120px] resize-none"
              rows={2}
              disabled={isLoading || (voiceEnabled && isConnected)}
            />

            <div className="flex flex-col gap-2">
              {voiceEnabled && (
                <Button
                  variant={isListening ? "default" : "outline"}
                  size="icon"
                  onClick={handleMicToggle}
                  className={cn(isListening && "animate-pulse")}
                  disabled={isSpeaking}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}

              <Button
                onClick={handleSend}
                size="icon"
                disabled={!input.trim() || isLoading || (voiceEnabled && isConnected)}
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
    </div>
  );
}
