// Extract behavioural traits from a user turn. Cheap, deterministic, additive.
// Also compute a "Paris knows you" score from breadth of learned signals.

export type Trait =
  | "romantic" | "family" | "quiet" | "photography" | "culture"
  | "food" | "gourmand" | "vegetarian" | "vegan" | "glutenFree"
  | "coffee" | "wine" | "bakery"
  | "outdoor" | "indoor" | "rainy" | "night" | "morning" | "sunset"
  | "slowPace" | "briskPace"
  | "hidden" | "iconic"
  | "budgetLow" | "budgetHigh"
  | "walker" | "kids";

const RULES: { trait: Trait; rx: RegExp }[] = [
  { trait: "romantic",    rx: /romantic|date|proposal|honeymoon|intimate/i },
  { trait: "family",      rx: /family|kids?|children|toddler|stroller/i },
  { trait: "kids",        rx: /kids?|children|toddler/i },
  { trait: "quiet",       rx: /quiet|calm|peaceful|slow|hidden/i },
  { trait: "photography", rx: /photo|photograph|instagram|shot|golden hour|frame/i },
  { trait: "culture",     rx: /museum|art|gallery|history|opera|theater|theatre/i },
  { trait: "food",        rx: /eat|food|dinner|lunch|restaurant|bistro|brunch|breakfast/i },
  { trait: "gourmand",    rx: /gourmand|tasting|michelin|chef/i },
  { trait: "vegetarian",  rx: /vegetarian|veggie/i },
  { trait: "vegan",       rx: /vegan/i },
  { trait: "glutenFree",  rx: /gluten[- ]?free/i },
  { trait: "coffee",      rx: /coffee|café|cafe|espresso|latte|flat white/i },
  { trait: "wine",        rx: /wine|natural wine|apéro|apero|cocktail|bar/i },
  { trait: "bakery",      rx: /bakery|boulangerie|pastr|croissant|pain au/i },
  { trait: "outdoor",     rx: /park|outdoor|walk|stroll|garden|picnic|riverside|canal|seine/i },
  { trait: "indoor",      rx: /indoor|covered|passage|arcade/i },
  { trait: "rainy",       rx: /rain|wet|storm|drizzle/i },
  { trait: "night",       rx: /night|nightlife|late|midnight|after dark|evening/i },
  { trait: "morning",     rx: /morning|dawn|early|sunrise/i },
  { trait: "sunset",      rx: /sunset|dusk|golden hour/i },
  { trait: "slowPace",    rx: /slow|relax|unwind|linger|no rush/i },
  { trait: "briskPace",   rx: /quick|fast|efficient|in a hurry|tight/i },
  { trait: "hidden",      rx: /hidden|secret|local|off the beaten/i },
  { trait: "iconic",      rx: /iconic|classic|must[- ]?see|famous|eiffel|louvre|notre[- ]?dame/i },
  { trait: "budgetLow",   rx: /cheap|budget|affordable|free/i },
  { trait: "budgetHigh",  rx: /luxury|fancy|upscale|splurge|expensive/i },
  { trait: "walker",      rx: /walk|walking|on foot|steps/i },
];

export function extractTraits(text: string): Trait[] {
  const hits = new Set<Trait>();
  for (const r of RULES) if (r.rx.test(text)) hits.add(r.trait);
  return [...hits];
}

// A gentle 0-100 score. Grows with distinct traits + turns; caps at 100.
export function computeKnowsYou(distinctTraits: number, turns: number): number {
  const traitScore = Math.min(70, distinctTraits * 7);
  const turnScore = Math.min(30, turns * 4);
  return Math.min(100, Math.round(traitScore + turnScore));
}

// Pretty labels for chip UI.
export const TRAIT_LABELS: Record<Trait, string> = {
  romantic: "romantic", family: "family", quiet: "quiet lover",
  photography: "photo eye", culture: "culture-seeker", food: "eats out",
  gourmand: "gourmand", vegetarian: "vegetarian", vegan: "vegan",
  glutenFree: "gluten-free", coffee: "coffee-first", wine: "wine hour",
  bakery: "boulangerie person", outdoor: "outdoor", indoor: "prefers covered",
  rainy: "rain-aware", night: "night owl", morning: "morning lark",
  sunset: "sunset chaser", slowPace: "slow pace", briskPace: "brisk pace",
  hidden: "hidden gems", iconic: "iconic sights", budgetLow: "budget-savvy",
  budgetHigh: "splurger", walker: "walker", kids: "with kids",
};
