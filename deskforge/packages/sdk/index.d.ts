/** Typings for the `window.deskforge` object injected into every Deskforge plugin. */

export type Unsubscribe = () => void;

export interface TrackInfo {
  title: string;
  playing: boolean;
  /** Seconds. */
  position: number;
  /** Seconds. */
  duration: number;
}

export interface SystemStats {
  /** 0 to 100. */
  cpu: number;
  /** Bytes. */
  memUsed: number;
  /** Bytes. */
  memTotal: number;
}

export interface DeskforgeApi {
  readonly version: string;
  /** Resolves with the plugin settings (defaults merged with the user's values). */
  ready(): Promise<Record<string, unknown>>;
  settings: {
    get<T = unknown>(key: string): Promise<T>;
    all(): Promise<Record<string, unknown>>;
    onChange(cb: (settings: Record<string, unknown>) => void): Unsubscribe;
  };
  /** Needs the "audio" permission in manifest.json. */
  audio: {
    /** 64 values between 0 and 1, low to high frequencies. About 30 times per second. */
    onSpectrum(cb: (bins: number[]) => void): Unsubscribe;
    /** Called on each detected beat with the bass level (0 to 1). */
    onBeat(cb: (level: number) => void): Unsubscribe;
    onTrack(cb: (track: TrackInfo) => void): Unsubscribe;
  };
  /** Needs the "system-stats" permission in manifest.json. */
  system: {
    /** About once per second. */
    onStats(cb: (stats: SystemStats) => void): Unsubscribe;
  };
}

declare global {
  interface Window {
    deskforge: DeskforgeApi;
  }
  const deskforge: DeskforgeApi;
}
