export type WallpaperKind = 'none' | 'image' | 'video' | 'html' | 'shader' | 'plugin';
export type WidgetType = 'clock' | 'date' | 'system' | 'music' | 'notes' | 'countdown' | 'weather' | 'plugin';
export type VisualizerStyle = 'bars' | 'wave' | 'circle' | 'particles';
export type LoopMode = 'off' | 'all' | 'one';

export interface WallpaperConfig {
  enabled: boolean;
  kind: WallpaperKind;
  path: string;
  shaderId: string;
  pluginId: string;
  fit: 'cover' | 'contain';
  pauseOnFullscreen: boolean;
}

export interface VisualizerConfig {
  enabled: boolean;
  style: VisualizerStyle;
  color: string;
  sensitivity: number;
  position: 'bottom' | 'center' | 'full';
}

/** Position and size are percentages of the screen, so layouts survive resolution changes. */
export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  bg: number;
  blur: number;
  accent: string;
  pluginId?: string;
  settings: Record<string, unknown>;
}

export interface Profile {
  id: string;
  name: string;
  wallpaper: WallpaperConfig;
  visualizer: VisualizerConfig;
  widgets: WidgetInstance[];
}

export interface Track {
  id: string;
  path: string;
  title: string;
}

export interface AppConfig {
  version: 1;
  accent: string;
  themePluginId: string;
  activeProfileId: string;
  profiles: Profile[];
  library: Track[];
  volume: number;
  loop: LoopMode;
  shuffle: boolean;
  batterySaver: boolean;
  plugins: Record<string, { enabled: boolean; settings: Record<string, unknown> }>;
}

export interface AudioState {
  playing: boolean;
  trackId: string | null;
  position: number;
  duration: number;
}

export type AudioCommand =
  | { type: 'play'; trackId?: string }
  | { type: 'pause' }
  | { type: 'toggle' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'seek'; position: number };

export interface SystemStats {
  cpu: number;
  memUsed: number;
  memTotal: number;
}

// ---------------------------------------------------------------- plugins

export type PluginType = 'widget' | 'wallpaper' | 'theme';
export type PluginPermission = 'audio' | 'system-stats';

export type PluginSetting =
  | { key: string; label: string; type: 'color'; default: string }
  | { key: string; label: string; type: 'text'; default: string }
  | { key: string; label: string; type: 'toggle'; default: boolean }
  | { key: string; label: string; type: 'number'; default: number; min?: number; max?: number; step?: number }
  | { key: string; label: string; type: 'select'; default: string; options: string[] };

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  type: PluginType;
  entry?: string;
  permissions?: PluginPermission[];
  settings?: PluginSetting[];
  /** Default widget size in percent of the screen. */
  size?: { w: number; h: number };
  /** CSS variables applied by theme plugins. */
  theme?: Record<string, string>;
}

export interface PluginInfo {
  dir: string;
  builtin: boolean;
  manifest: PluginManifest;
}
