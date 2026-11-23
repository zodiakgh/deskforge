export interface ShaderDef { id: string; name: string; frag: string }

const HEAD = `precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uAudio; uniform vec3 uAccent;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.;a*=.5;}return v;}
`;

export const SHADERS: ShaderDef[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    frag: HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=uv*vec2(uRes.x/uRes.y,1.)*2.;
  float t=uTime*.07;
  float n=fbm(p+vec2(t,fbm(p*1.4-t)));
  float band=smoothstep(.22,.92,n+uv.y*.38-.2+uAudio*.25);
  vec3 deep=vec3(.03,.04,.10);
  vec3 col=mix(deep,uAccent,band);
  col+=vec3(.06,.16,.30)*pow(n,3.)*(.7+uAudio);
  col*=.85+.15*sin(uTime*.2+uv.x*3.);
  gl_FragColor=vec4(col,1.);
}`
  },
  {
    id: 'plasma',
    name: 'Plasma',
    frag: HEAD + `
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float t=uTime*.25;
  float v=sin(uv.x*6.+t)+sin((uv.y*5.+t)*1.3)+sin((uv.x+uv.y)*5.+t*.7)+sin(length(uv)*9.-t*1.5);
  v=v*.25+.5+uAudio*.15;
  vec3 col=mix(vec3(.04,.03,.12),uAccent,smoothstep(.2,.95,v));
  col=mix(col,col.zxy,.25*sin(t+v*3.));
  gl_FragColor=vec4(col,1.);
}`
  },
  {
    id: 'grid',
    name: 'Horizon grid',
    frag: HEAD + `
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float horizon=.46;
  vec3 col=mix(vec3(.02,.02,.07),vec3(.10,.07,.20),uv.y);
  if(uv.y<horizon){
    float d=horizon-uv.y;
    vec2 g=vec2((uv.x-.5)*uRes.x/uRes.y/d*.5, 1./d+uTime*(.5+uAudio));
    vec2 l=abs(fract(g*vec2(1.,.6))-.5);
    float line=smoothstep(.47,.5,max(l.x,l.y*0.9));
    float fade=smoothstep(0.,.25,d);
    col=mix(col,uAccent,line*fade*(.7+uAudio));
  }else{
    float s=smoothstep(.08,.0,abs(uv.y-horizon-.08)-.0);
    col+=uAccent*.12*exp(-(uv.y-horizon)*14.)*(1.+uAudio);
    col+=s*0.;
  }
  gl_FragColor=vec4(col,1.);
}`
  }
];

export const shaderById = (id: string) => SHADERS.find((s) => s.id === id) ?? SHADERS[0];
