import type { AppConfig, Profile, WidgetInstance, WidgetType } from './types';

export const CONFIG_KEY = 'deskforge.config.v1';

export const uid = () => Math.random().toString(36).slice(2, 10);
export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export const WIDGET_DEFAULTS: Record<Exclude<WidgetType, 'plugin'>, Omit<WidgetInstance, 'id' | 'x' | 'y'>> = {
  clock: { type: 'clock', w: 24, h: 20, bg: 0, blur: 0, accent: '', settings: { hour12: false, seconds: false } },
  date: { type: 'date', w: 24, h: 8, bg: 0, blur: 0, accent: '', settings: {} },
  system: { type: 'system', w: 18, h: 16, bg: 0.35, blur: 14, accent: '', settings: {} },
  music: { type: 'music', w: 26, h: 15, bg: 0.35, blur: 14, accent: '', settings: {} },
  notes: { type: 'notes', w: 20, h: 22, bg: 0.35, blur: 14, accent: '', settings: { text: 'Write something here.\nEdit it in Deskforge > Widgets.' } },
  countdown: { type: 'countdown', w: 20, h: 14, bg: 0.35, blur: 14, accent: '', settings: { label: 'Release day', date: '2027-01-01T00:00' } },
  weather: { type: 'weather', w: 18, h: 14, bg: 0.35, blur: 14, accent: '', settings: { city: 'Paris', lat: 48.85, lon: 2.35 } }
};

export function makeWidget(type: Exclude<WidgetType, 'plugin'>, x: number, y: number): WidgetInstance {
  return { id: uid(), x, y, ...clone(WIDGET_DEFAULTS[type]) };
}

export function makeProfile(name: string): Profile {
  return {
    id: uid(),
    name,
    wallpaper: {
      enabled: false,
      kind: 'shader',
      path: '',
      shaderId: 'aurora',
      pluginId: '',
      fit: 'cover',
      pauseOnFullscreen: true
    },
    visualizer: { enabled: true, style: 'bars', color: '', sensitivity: 1, position: 'bottom' },
    widgets: [
      makeWidget('clock', 6, 8),
      makeWidget('date', 6, 29),
      makeWidget('music', 6, 76),
      makeWidget('system', 76, 8)
    ]
  };
}

export function defaultConfig(): AppConfig {
  const chill = makeProfile('Chill');
  return {
    version: 1,
    accent: '#ffb36b',
    themePluginId: '',
    activeProfileId: chill.id,
    profiles: [chill],
    library: [],
    volume: 0.7,
    loop: 'all',
    shuffle: false,
    batterySaver: false,
    plugins: {}
  };
}

/** Reads the saved config and fills in anything a newer version added. */
export function loadConfig(): AppConfig {
  const base = defaultConfig();
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<AppConfig>;
    const merged: AppConfig = { ...base, ...saved };
    if (!merged.profiles?.length) return base;
    if (!merged.profiles.some((p) => p.id === merged.activeProfileId)) {
      merged.activeProfileId = merged.profiles[0].id;
    }
    return merged;
  } catch {
    return base;
  }
}

export function saveConfig(c: AppConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
  } catch (e) {
    console.warn('Could not save config', e);
  }
}

export function activeProfileOf(c: AppConfig): Profile {
  return c.profiles.find((p) => p.id === c.activeProfileId) ?? c.profiles[0];
}

export function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [1, 0.7, 0.42];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
