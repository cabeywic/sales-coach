"use client";

import { Message } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { speak, voiceEnabled } = useVoice();
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-secondary"}>
          {isUser ? "You" : "AI"}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.timestamp), "h:mm a")}
          </span>

          {!isUser && voiceEnabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => speak(message.content)}
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
