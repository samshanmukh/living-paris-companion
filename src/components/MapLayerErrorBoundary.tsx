import { Component, type ReactNode } from "react";

/** Catches render errors from map embellishment hooks so the map still loads. */
export class MapLayerErrorBoundary extends Component<
  { children: ReactNode; name?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(`[${this.props.name ?? "map-layer"}]`, error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
