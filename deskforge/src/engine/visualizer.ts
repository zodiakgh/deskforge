import type { VisualizerConfig } from '../lib/types';

const BINS = 64;

/** Reduces the raw FFT to `BINS` values on a roughly logarithmic scale (0..1). */
export function reduceSpectrum(raw: Uint8Array, out: Float32Array = new Float32Array(BINS)): Float32Array {
  const max = raw.length * 0.75; // ignore the empty top of the spectrum
  for (let i = 0; i < BINS; i++) {
    const a = Math.floor(Math.pow(i / BINS, 2) * max);
    const b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / BINS, 2) * max));
    let sum = 0;
    for (let j = a; j < b; j++) sum += raw[j];
    out[i] = sum / (b - a) / 255;
  }
  return out;
}

export function beatLevel(bins: Float32Array): number {
  let s = 0;
  for (let i = 0; i < 6; i++) s += bins[i];
  return s / 6;
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; size: number }

export class Visualizer {
  private ctx: CanvasRenderingContext2D;
  private smooth = new Float32Array(BINS);
  private particles: Particle[] = [];
  private avg = 0;
  private lastBeat = 0;
  beat = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Updates smoothing and beat detection. Returns the bass level (0..1). */
  analyze(bins: Float32Array, k: number, now: number): number {
    for (let i = 0; i < BINS; i++) this.smooth[i] = Math.max(bins[i] * k, this.smooth[i] * 0.9);
    const level = beatLevel(bins) * k;
    this.beat = level > this.avg * 1.35 && level > 0.25 && now - this.lastBeat > 180;
    if (this.beat) this.lastBeat = now;
    this.avg = this.avg * 0.94 + level * 0.06;
    return level;
  }

  draw(bins: Float32Array, cfg: VisualizerConfig, accent: string, now: number) {
    const { ctx, canvas } = this;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const color = cfg.color || accent;
    const level = this.analyze(bins, cfg.sensitivity, now);

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const zone = cfg.position === 'full' ? 1 : cfg.position === 'center' ? 0.5 : 0.34;
    const base = cfg.position === 'center' ? H / 2 : H;

    switch (cfg.style) {
      case 'bars': {
        const gap = W / BINS;
        const bw = gap * 0.6;
        ctx.globalAlpha = cfg.position === 'full' ? 0.45 : 0.9;
        for (let i = 0; i < BINS; i++) {
          const h = Math.min(1, this.smooth[i]) * H * zone;
          if (cfg.position === 'center') this.round(i * gap + (gap - bw) / 2, base - h / 2, bw, Math.max(h, 2), bw / 2);
          else this.round(i * gap + (gap - bw) / 2, base - h, bw, Math.max(h, 2), bw / 2);
        }
        break;
      }
      case 'wave': {
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = Math.max(2, H / 360);
        ctx.beginPath();
        for (let i = 0; i < BINS; i++) {
          const x = (i / (BINS - 1)) * W;
          const y = (cfg.position === 'center' ? H / 2 : H - H * zone * 0.5) - Math.min(1, this.smooth[i]) * H * zone * 0.5 * (i % 2 ? 1 : -1);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      }
      case 'circle': {
        const cx = W / 2, cy = cfg.position === 'bottom' ? H * 0.72 : H / 2;
        const r = Math.min(W, H) * (cfg.position === 'full' ? 0.22 : 0.14);
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = Math.max(2, H / 300);
        for (let i = 0; i < BINS * 2; i++) {
          const v = Math.min(1, this.smooth[i % BINS]);
          const a = (i / (BINS * 2)) * Math.PI * 2 - Math.PI / 2;
          const len = v * r * 0.9 + 3;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          ctx.lineTo(cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len));
          ctx.stroke();
        }
        break;
      }
      case 'particles': {
        if (this.beat || level > 0.35) {
          for (let n = 0; n < Math.ceil(level * 6); n++) {
            this.particles.push({
              x: Math.random() * W, y: H * (cfg.position === 'center' ? 0.5 + (Math.random() - 0.5) * 0.3 : 1),
              vx: (Math.random() - 0.5) * 0.6, vy: -(1 + Math.random() * 2.5) * (H / 700),
              life: 1, size: (2 + Math.random() * 5) * (H / 900)
            });
          }
        }
        this.particles = this.particles.filter((p) => p.life > 0).slice(-400);
        for (const p of this.particles) {
          p.x += p.vx; p.y += p.vy; p.life -= 0.007;
          ctx.globalAlpha = Math.max(0, p.life) * 0.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
    }
    ctx.globalAlpha = 1;
  }

  private round(x: number, y: number, w: number, h: number, r: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }
}
