import { Persona, PersonaType } from "@/types";

export const personas: Record<PersonaType, Persona> = {
  professional: {
    name: "Professional Coach",
    tone: "formal, data-driven",
    greeting: "Good morning. Let's review your objectives for today.",
    style: {
      formality: "high",
      dataEmphasis: "high",
      motivation: "medium",
      empathy: "medium",
    },
    voiceConfig: {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    },
  },
  friendly: {
    name: "Friendly Mentor",
    tone: "warm, supportive",
    greeting: "Hey there! Ready to crush it today?",
    style: {
      formality: "low",
      dataEmphasis: "medium",
      motivation: "high",
      empathy: "high",
    },
    voiceConfig: {
      rate: 1.1,
      pitch: 1.1,
      volume: 1.0,
    },
  },
  motivator: {
    name: "Energetic Motivator",
    tone: "enthusiastic, celebratory",
    greeting: "LET'S GO! Time to dominate your territory!",
    style: {
      formality: "low",
      dataEmphasis: "low",
      motivation: "very high",
      empathy: "medium",
    },
    voiceConfig: {
      rate: 1.2,
      pitch: 1.2,
      volume: 1.0,
    },
  },
  advisor: {
    name: "Wise Advisor",
    tone: "calm, strategic",
    greeting: "Good morning. Let's think strategically about today.",
    style: {
      formality: "medium",
      dataEmphasis: "high",
      motivation: "medium",
      empathy: "high",
    },
    voiceConfig: {
      rate: 0.95,
      pitch: 0.95,
      volume: 1.0,
    },
  },
};

export function getPersona(type: PersonaType): Persona {
  return personas[type];
}

export function getGreeting(type: PersonaType, dsrName: string, timeOfDay: "morning" | "afternoon" | "evening"): string {
  const persona = personas[type];
  const time = timeOfDay === "morning" ? "morning" : timeOfDay === "afternoon" ? "afternoon" : "evening";

  switch (type) {
    case "professional":
      return `Good ${time}, ${dsrName}. Let's review your objectives.`;
    case "friendly":
      return `Hey ${dsrName}! Ready to make it a great ${time}?`;
    case "motivator":
      return `${dsrName}! LET'S DOMINATE THIS ${time.toUpperCase()}!`;
    case "advisor":
      return `Good ${time}, ${dsrName}. Let's think strategically about your day.`;
    default:
      return persona.greeting;
  }
}
