"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MicOff } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { QuickActions } from "./QuickActions";
import { useVoice } from "@/hooks/useVoice";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  mode: "checkin" | "coaching";
  onSendMessage?: (message: string) => void;
  placeholder?: string;
}

export function ChatInterface({
  mode,
  onSendMessage,
  placeholder = "Ask me anything...",
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    currentConversation,
    addMessage,
    selectedPersona,
    voiceEnabled,
  } = useStore();
  const { speak, startListening, stopListening, isListening } = useVoice();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversation]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      metadata: { mode, persona: selectedPersona },
    };

    addMessage(userMessage);

    if (onSendMessage) {
      onSendMessage(input);
    }

    setInput("");
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        setInput(transcript);
      });
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
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {currentConversation.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg mb-2">
                {mode === "checkin"
                  ? "Ready to start your day?"
                  : "Let's work on improving your performance"}
              </p>
              <p className="text-sm">Ask me anything or use quick actions below</p>
            </div>
          ) : (
            currentConversation.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
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
            />

            <div className="flex flex-col gap-2">
              {voiceEnabled && (
                <Button
                  variant={isListening ? "default" : "outline"}
                  size="icon"
                  onClick={handleVoiceInput}
                  className={cn(isListening && "animate-pulse")}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}

              <Button onClick={handleSend} size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
