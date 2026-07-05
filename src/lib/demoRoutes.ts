// Hardcoded demo scenario: Gare du Nord → Louvre Museum.
// Six persona routes with distinct paths, colors, labels, and reasons.
// No API calls — pure mock data for the hackathon demo moment.

export type PersonaKey =
  | "asthma"
  | "wheelchair"
  | "sensory"
  | "night"
  | "halal"
  | "date";

export interface DemoRoute {
  key: PersonaKey;
  label: string;
  reason: string;
  color: string;
  distanceKm: number;
  minutes: number;
  coords: [number, number][]; // [lon, lat]
}

export const DEMO_START: { name: string; coord: [number, number] } = {
  name: "Gare du Nord",
  coord: [2.3554, 48.8809],
};

export const DEMO_END: { name: string; coord: [number, number] } = {
  name: "Louvre Museum",
  coord: [2.3376, 48.8606],
};

// Hand-crafted polylines varying via Paris neighborhoods.
export const DEMO_ROUTES: DemoRoute[] = [
  {
    key: "asthma",
    label: "Cleaner air route",
    reason: "Avoids polluted roads",
    color: "#2FAE66",
    distanceKm: 3.6,
    minutes: 44,
    coords: [
      [2.3554, 48.8809],
      [2.3520, 48.8785],
      [2.3470, 48.8760], // via Square Montholon (green)
      [2.3430, 48.8735],
      [2.3405, 48.8705],
      [2.3395, 48.8670],
      [2.3385, 48.8635],
      [2.3376, 48.8606],
    ],
  },
  {
    key: "wheelchair",
    label: "Step-free route",
    reason: "Avoids stairs, prefers lifts",
    color: "#2E7BE8",
    distanceKm: 3.2,
    minutes: 38,
    coords: [
      [2.3554, 48.8809],
      [2.3540, 48.8770], // Poissonnière (lift-equipped)
      [2.3510, 48.8735],
      [2.3475, 48.8705],
      [2.3440, 48.8680],
      [2.3410, 48.8650],
      [2.3390, 48.8625],
      [2.3376, 48.8606],
    ],
  },
  {
    key: "sensory",
    label: "Quieter route",
    reason: "Avoids loud/crowded streets",
    color: "#8B5CF6",
    distanceKm: 3.5,
    minutes: 42,
    coords: [
      [2.3554, 48.8809],
      [2.3585, 48.8775],
      [2.3570, 48.8740], // side streets east of Sentier
      [2.3540, 48.8710],
      [2.3500, 48.8680],
      [2.3450, 48.8650],
      [2.3405, 48.8625],
      [2.3376, 48.8606],
    ],
  },
  {
    key: "night",
    label: "Well-lit route",
    reason: "Prefers lit and active streets",
    color: "#F59E0B",
    distanceKm: 3.4,
    minutes: 40,
    coords: [
      [2.3554, 48.8809],
      [2.3500, 48.8790], // Bd de Magenta → Strasbourg-Saint-Denis (lit)
      [2.3465, 48.8735],
      [2.3440, 48.8695],
      [2.3420, 48.8665],
      [2.3400, 48.8640],
      [2.3388, 48.8620],
      [2.3376, 48.8606],
    ],
  },
  {
    key: "halal",
    label: "Halal-aware route",
    reason: "Includes halal/prayer-aware stops",
    color: "#14B8A6",
    distanceKm: 3.7,
    minutes: 45,
    coords: [
      [2.3554, 48.8809],
      [2.3590, 48.8780], // via Faubourg-Saint-Denis (halal eateries)
      [2.3560, 48.8740],
      [2.3520, 48.8710],
      [2.3480, 48.8685],
      [2.3440, 48.8655],
      [2.3405, 48.8625],
      [2.3376, 48.8606],
    ],
  },
  {
    key: "date",
    label: "Date-night route",
    reason: "Scenic and budget-friendly stops",
    color: "#EC4899",
    distanceKm: 3.8,
    minutes: 47,
    coords: [
      [2.3554, 48.8809],
      [2.3505, 48.8770],
      [2.3455, 48.8735], // Passage Verdeau / Passage Jouffroy
      [2.3420, 48.8705],
      [2.3395, 48.8680],
      [2.3380, 48.8650],
      [2.3378, 48.8625],
      [2.3376, 48.8606],
    ],
  },
];

export const DEMO_BOUNDS: [[number, number], [number, number]] = [
  [2.335, 48.858],
  [2.360, 48.883],
];
