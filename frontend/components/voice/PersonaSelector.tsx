"use client";

import { useStore } from "@/store/useStore";
import { PersonaType } from "@/types";
import { personas } from "@/lib/agents/persona-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PersonaSelector() {
  const { selectedPersona, setSelectedPersona } = useStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Persona</CardTitle>
        <CardDescription>
          Choose how your coach communicates with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedPersona}
          onValueChange={(value) => setSelectedPersona(value as PersonaType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(personas) as PersonaType[]).map((key) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span className="font-medium">{personas[key].name}</span>
                  <span className="text-xs text-muted-foreground">
                    {personas[key].tone}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Sample Greeting:</p>
          <p className="text-sm text-muted-foreground italic">
            "{personas[selectedPersona].greeting}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
