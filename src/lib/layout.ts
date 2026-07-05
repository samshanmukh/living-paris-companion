/** Shared overlay spacing so fixed UI panels don't collide. */
export const LAYOUT = {
  inset: 12,
  personaBtn: 44,
  mapControlsW: 40,
  topBarH: 44,
  topGap: 10,
  bottomInset: 12,
  voiceOrbSize: 72,
  voiceOrbBottom: 236,
  chatCollapsedBottom: 52,
  chatExpandedBottom: 24,
} as const;

export function topSafe(extra = 0) {
  return `calc(${LAYOUT.inset + extra}px + env(safe-area-inset-top))`;
}

export function bottomSafe(extra = 0) {
  return `calc(${LAYOUT.bottomInset + extra}px + env(safe-area-inset-bottom))`;
}

/** Left edge of the center top bar (after persona menu). */
export function topBarLeft() {
  return LAYOUT.inset + LAYOUT.personaBtn + LAYOUT.topGap;
}

/** Right edge inset — leaves room for the map control column. */
export function topBarRight() {
  return LAYOUT.inset + LAYOUT.mapControlsW + LAYOUT.topGap;
}

/** Vertical start for panels that sit below the top bar. */
export function belowTopBar(extra = 0) {
  return `calc(${LAYOUT.inset + LAYOUT.topBarH + LAYOUT.topGap + extra}px + env(safe-area-inset-top))`;
}

/** Bottom offset that clears voice orb + collapsed chat. */
export function aboveBottomChrome(extra = 0) {
  return bottomSafe(LAYOUT.voiceOrbBottom + LAYOUT.voiceOrbSize + extra);
}
