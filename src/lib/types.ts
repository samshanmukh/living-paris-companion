import type { Feature, FeatureCollection, LineString, Point, Position } from "geojson";

export type MoodType =
  | "romantic"
  | "family"
  | "rainy"
  | "photography"
  | "nightlife"
  | "relaxing"
  | "hidden"
  | "food"
  | "culture"
  | "general";

export type LayerType =
  | "cafes"
  | "museums"
  | "metro"
  | "parks"
  | "trees"
  | "bikes"
  | "accessibility"
  | "noise"
  | "air-quality";

export interface ParisFeatureProperties {
  id: string;
  name: string;
  layer: LayerType | string;
  type?: string;
  address?: string;
  arrondissement?: string | number;
  accessible?: boolean;
  indoor?: boolean;
  romantic?: boolean;
  familyFriendly?: boolean;
  quiet?: boolean;
  budgetLevel?: number;
  noiseLevel?: number;
  airQualityIndex?: number;
  capacity?: number;
  tags?: string[];
  dietary?: string[];
  source?: string;
  scoreHint?: number;
}

export type ParisFeature = Feature<Point, ParisFeatureProperties>;
export type ParisFeatureCollection = FeatureCollection<Point, ParisFeatureProperties>;

export interface IntentQuery {
  mood?: MoodType;
  budget?: number;
  walk?: number;
  accessibility?: boolean;
  indoor?: boolean;
  rainy?: boolean;
  dietary?: string[];
  lat?: number;
  lon?: number;
  radius?: number;
  layers?: LayerType[];
  limit?: number;
}

export interface GuestProfile {
  name?: string | null;
  language?: string | null;
  visitorType?: "visitor" | "local" | null;
  companions?: string | null;
  onTheirMind?: string | null;
  exploreStyle?: string | null;
  tasteOfHome?: string | null;
  dietary?: string | null;
  accessibility?: string | null;
  budget?: string | null;
  energy?: string | null;
  notes?: string | null;
}

export type MapActionType =
  | "flyTo"
  | "highlight"
  | "route"
  | "save"
  | "annotate"
  | "setAccent"
  | "relight";

export interface MapAction {
  type: MapActionType;
  lat?: number;
  lon?: number;
  zoom?: number;
  placeId?: string;
  placeName?: string;
  mood?: MoodType;
  hour?: number;
  rain?: boolean;
  lightPreset?: "dawn" | "day" | "dusk" | "night";
  text?: string;
}

export interface MapAnnotation {
  lon: number;
  lat: number;
  text: string;
}

export interface SpatialQueryResult {
  intent: IntentQuery;
  layers: LayerType[];
  totalFeatures: number;
  geojson: ParisFeatureCollection;
  meta: {
    radiusMeters: number;
    center: [number, number];
    queryMs: number;
  };
}

export interface RouteWaypoint {
  lon: number;
  lat: number;
  name?: string;
  id?: string;
}

export interface RouteLeg {
  from: RouteWaypoint;
  to: RouteWaypoint;
  distanceMeters: number;
  durationMinutes: number;
}

export interface RouteResponse {
  profile: "walking" | "cycling";
  provider: string;
  geometry: Feature<LineString>;
  distanceMeters: number;
  durationMinutes: number;
  legs: RouteLeg[];
  cameraPath: Position[];
  accessible: boolean;
  note?: string;
}

export interface AqiStation {
  id: number;
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  dominantPol?: string;
}

export interface ParisAirQualitySnapshot {
  cityAqi: number;
  cityName: string;
  dominantPol?: string;
  updatedAt: string;
  stations: AqiStation[];
  attribution: string;
}
