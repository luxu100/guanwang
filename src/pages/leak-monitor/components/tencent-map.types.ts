export interface TencentMapInstanceHandle {
  resize?: () => void;
  destroy?: () => void;
  getZoom?: () => number;
  easeTo?: (options: { center: unknown; zoom?: number }) => void;
  fitBounds?: (bounds: unknown, options?: { padding?: number }) => void;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
}
