import { invoke } from '@tauri-apps/api/core';
import type { AudioCommand, AudioState, LoopMode, Track } from '../lib/types';

const MIME: Record<string, string> = {
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  m4a: 'audio/mp4', aac: 'audio/aac', opus: 'audio/ogg'
};

/**
 * Plays the user's own music and exposes a spectrum for visualizers.
 * Lives in the wallpaper window, which is always running, so music keeps
 * playing when the control panel is hidden in the tray.
 */
export class AudioEngine {
  private el = new Audio();
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private tracks: Track[] = [];
  private objectUrl = '';
  private history: string[] = [];
  private listeners = new Set<(s: AudioState) => void>();
  loop: LoopMode = 'all';
  shuffle = false;
  state: AudioState = { playing: false, trackId: null, position: 0, duration: 0 };
  readonly spectrum = new Uint8Array(512);

  constructor() {
    this.el.addEventListener('timeupdate', () => this.patch({ position: this.el.currentTime }));
    this.el.addEventListener('durationchange', () => this.patch({ duration: this.el.duration || 0 }));
    this.el.addEventListener('play', () => this.patch({ playing: true }));
    this.el.addEventListener('pause', () => this.patch({ playing: false }));
    this.el.addEventListener('ended', () => void this.onEnded());
  }

  onChange(cb: (s: AudioState) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private patch(p: Partial<AudioState>) {
    this.state = { ...this.state, ...p };
    this.listeners.forEach((l) => l(this.state));
  }

  setTracks(tracks: Track[]) {
    this.tracks = tracks;
    if (this.state.trackId && !tracks.some((t) => t.id === this.state.trackId)) {
      this.el.pause();
      this.patch({ trackId: null, position: 0, duration: 0 });
    }
  }

  setVolume(v: number) {
    this.el.volume = Math.min(1, Math.max(0, v));
  }

  private ensureContext() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    const source = this.ctx.createMediaElementSource(this.el);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.78;
    source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  /** Fills `spectrum` and returns it. Zeroed when nothing is playing. */
  sample(): Uint8Array {
    if (this.analyser && this.state.playing) this.analyser.getByteFrequencyData(this.spectrum);
    else this.spectrum.fill(0);
    return this.spectrum;
  }

  private async load(track: Track) {
    const bytes = await invoke<ArrayBuffer>('read_audio_file', { path: track.path });
    const ext = track.path.split('.').pop()?.toLowerCase() ?? 'mp3';
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = URL.createObjectURL(new Blob([bytes], { type: MIME[ext] ?? 'audio/mpeg' }));
    this.el.src = this.objectUrl;
  }

  async play(trackId?: string) {
    const id = trackId ?? this.state.trackId ?? this.tracks[0]?.id;
    const track = this.tracks.find((t) => t.id === id);
    if (!track) return;
    this.ensureContext();
    await this.ctx!.resume();
    if (track.id !== this.state.trackId || !this.el.src) {
      if (this.state.trackId) this.history.push(this.state.trackId);
      this.patch({ trackId: track.id, position: 0 });
      try {
        await this.load(track);
      } catch (e) {
        console.warn('Could not load track', track.path, e);
        return;
      }
    }
    await this.el.play().catch((e) => console.warn(e));
  }

  pause() {
    this.el.pause();
  }

  private pickNext(dir: 1 | -1): Track | undefined {
    if (!this.tracks.length) return undefined;
    if (dir === -1) {
      const prev = this.history.pop();
      const t = this.tracks.find((x) => x.id === prev);
      if (t) return t;
    }
    if (this.shuffle && this.tracks.length > 1) {
      let t: Track;
      do t = this.tracks[Math.floor(Math.random() * this.tracks.length)];
      while (t.id === this.state.trackId);
      return t;
    }
    const i = this.tracks.findIndex((t) => t.id === this.state.trackId);
    const n = i + dir;
    if (n < 0) return this.tracks[this.tracks.length - 1];
    if (n >= this.tracks.length) return this.loop === 'off' && dir === 1 ? undefined : this.tracks[0];
    return this.tracks[n];
  }

  private async onEnded() {
    if (this.loop === 'one') {
      this.el.currentTime = 0;
      await this.el.play();
      return;
    }
    const next = this.pickNext(1);
    if (next) await this.play(next.id);
    else this.patch({ playing: false, position: 0 });
  }

  async handle(cmd: AudioCommand) {
    switch (cmd.type) {
      case 'play': return this.play(cmd.trackId);
      case 'pause': return this.pause();
      case 'toggle': return this.state.playing ? this.pause() : this.play();
      case 'next': { const t = this.pickNext(1); if (t) await this.play(t.id); return; }
      case 'prev': {
        if (this.el.currentTime > 3) { this.el.currentTime = 0; return; }
        const t = this.pickNext(-1);
        if (t) await this.play(t.id);
        return;
      }
      case 'seek': this.el.currentTime = cmd.position; return;
    }
  }
}
