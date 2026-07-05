import { Accessibility, Ear, Heart, Moon, Utensils, Wind, type LucideIcon } from "lucide-react";
import type { PersonaKey } from "@/store/useUIStore";

export type PersonaDef = {
  key: PersonaKey;
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  needChip: string;
  prompt: string;
  conciergeHint: string;
};

export const PERSONAS: PersonaDef[] = [
  {
    key: "asthma",
    label: "Asthma",
    shortLabel: "Clean air",
    Icon: Wind,
    needChip: "I need clean air",
    prompt:
      "I have asthma. Plan a 45-min walk on streets with the cleanest air today — parks and pedestrian streets, not busy boulevards. Give me 3 specific low-pollution stops.",
    conciergeHint: "Guest has asthma — prioritize clean air, parks, avoid major traffic corridors; mention AQI when relevant.",
  },
  {
    key: "wheelchair",
    label: "Wheelchair",
    shortLabel: "Step-free",
    Icon: Accessibility,
    needChip: "I need step-free routes",
    prompt:
      "I use a manual wheelchair. Give me 3 fully step-free places within 20 min of Châtelet via lift-equipped métro. No cobblestone. List each venue's step-free entrance.",
    conciergeHint: "Guest uses a wheelchair — only step-free paths, lifts, flat surfaces; no cobblestones.",
  },
  {
    key: "sensory",
    label: "Sensory",
    shortLabel: "Quiet spots",
    Icon: Ear,
    needChip: "I need quiet places",
    prompt:
      "I'm noise-sensitive. Give me 3 quiet spots today — courtyards, hidden squares, backstreets. Route between them avoiding boulevards.",
    conciergeHint: "Guest is noise-sensitive — quiet venues, backstreets, avoid crowds and traffic.",
  },
  {
    key: "safety",
    label: "Night safety",
    shortLabel: "Safe at night",
    Icon: Moon,
    needChip: "I need a safe night walk",
    prompt:
      "It's late and I'm walking alone. Route me along well-lit streets with venues still open. Name the streets and avoid unlit park edges.",
    conciergeHint: "Guest needs night safety — well-lit routes, busy streets, venues open late.",
  },
  {
    key: "halal",
    label: "Halal",
    shortLabel: "Halal food",
    Icon: Utensils,
    needChip: "I need halal food",
    prompt:
      "I eat halal only. Give me 3 halal restaurants in Paris with the nearest prayer room to each.",
    conciergeHint: "Guest eats halal only — halal venues, prayer times when relevant.",
  },
  {
    key: "date",
    label: "Date night",
    shortLabel: "Date night",
    Icon: Heart,
    needChip: "I need a date night",
    prompt:
      "Plan a romantic date tonight: natural-wine bar, candlelit bistro, quiet Seine walk. Walkable loop under 1.2 km.",
    conciergeHint: "Guest wants a romantic date — intimate venues, walkable loop, evening mood.",
  },
];

export const PERSONA_NEED_CHIPS: PersonaDef[] = [
  PERSONAS.find((p) => p.key === "wheelchair")!,
  PERSONAS.find((p) => p.key === "halal")!,
  PERSONAS.find((p) => p.key === "safety")!,
];

export function personaByKey(key: PersonaKey | null): PersonaDef | undefined {
  if (!key) return undefined;
  return PERSONAS.find((p) => p.key === key);
}
