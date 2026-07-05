export type ChatPanelSize = "compact" | "tall" | "full";

export const CHAT_PANEL_HEIGHT: Record<ChatPanelSize, string> = {
  compact: "min(46vh, 380px)",
  tall: "min(58vh, 480px)",
  full: "min(92dvh, calc(100dvh - 52px - env(safe-area-inset-top)))",
};

export function resolveChatPanelSize(
  fullscreen: boolean,
  expanded: boolean,
  routePreviewPlaying: boolean,
): ChatPanelSize {
  if (fullscreen) return "full";
  if (expanded || routePreviewPlaying) return "tall";
  return "compact";
}

export function chatPanelBottomOffset(size: ChatPanelSize): string {
  return `calc(${CHAT_PANEL_HEIGHT[size]} + 12px + env(safe-area-inset-bottom))`;
}
