const LAST_PLAN_KEY = "lp.lastPlan.v1";

export type SavedPlan = {
  label: string;
  savedAt: number;
};

export function returnVisitorGreeting(turns: number, name?: string | null): string | null {
  if (turns < 2) return null;
  const saved = loadLastPlan();
  const nameBit = name?.trim() ? `${name.trim()}, ` : "";
  if (saved?.label) {
    return `${nameBit}welcome back — continue "${saved.label}" or start fresh?`;
  }
  return `${nameBit}welcome back — shall we continue where you left off?`;
}

export function saveLastPlan(label: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_PLAN_KEY, JSON.stringify({ label, savedAt: Date.now() } satisfies SavedPlan));
  } catch {}
}

export function loadLastPlan(): SavedPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedPlan;
  } catch {
    return null;
  }
}
