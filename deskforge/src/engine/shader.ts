import { hexToRgb01 } from '../lib/config';

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0., 1.); }`;

/** Draws a full-screen fragment shader. Uniforms: uRes, uTime, uAudio (0..1), uAccent. */
export class ShaderRenderer {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private start = performance.now();

  constructor(private canvas: HTMLCanvasElement, frag: string) {
    const gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;
    this.prog = this.link(VERT, frag);
    gl.useProgram(this.prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const n of ['uRes', 'uTime', 'uAudio', 'uAccent']) this.u[n] = gl.getUniformLocation(this.prog, n);
  }

  private compile(type: number, src: string) {
    const { gl } = this;
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
    return s;
  }

  private link(vert: string, frag: string) {
    const { gl } = this;
    const p = gl.createProgram()!;
    gl.attachShader(p, this.compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(p, this.compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link error');
    return p;
  }

  resize(scale = 1) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale;
    const w = Math.max(2, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(2, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  render(audio: number, accentHex: string) {
    const { gl } = this;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uTime, (performance.now() - this.start) / 1000);
    gl.uniform1f(this.u.uAudio, audio);
    gl.uniform3f(this.u.uAccent, ...hexToRgb01(accentHex));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
