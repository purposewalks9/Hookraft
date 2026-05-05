"use client";

import { useRef, useEffect, useMemo, useState, type CSSProperties } from "react";

// ── FRAGMENT SHADER ───────────────────────────────────────────────────────────

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;
  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);
  vec3 blended_color_2 = mix(color1, color2, r1);
  float blended_opacity_2 = mix(c1.a, c2.a, r1);
  vec3 c = mix(blended_color_2, color3, r2);
  float o = mix(blended_opacity_2, c3.a, r2);
  return vec4(c, o);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;
  float noise_scale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations_number; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);
  float shape = 0.;
  float mixer = 0.;

  if (u_shape < .5) {
    vec2 checks_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checks_uv.x) * cos(checks_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripes_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5; sh /= (noise_scale * u_resolution.y); sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);
  fragColor = vec4(color_mix.rgb, color_mix.a);
}`;

// ── HELPERS ───────────────────────────────────────────────────────────────────

function hexToRgba(hex: string): [number, number, number, number] {
  let r = 0, g = 0, b = 0, a = 1;
  if (hex.startsWith("#")) {
    const c = hex.slice(1);
    if (c.length === 3) {
      r = parseInt(c[0] + c[0], 16) / 255;
      g = parseInt(c[1] + c[1], 16) / 255;
      b = parseInt(c[2] + c[2], 16) / 255;
    } else if (c.length >= 6) {
      r = parseInt(c.slice(0, 2), 16) / 255;
      g = parseInt(c.slice(2, 4), 16) / 255;
      b = parseInt(c.slice(4, 6), 16) / 255;
      if (c.length === 8) a = parseInt(c.slice(6, 8), 16) / 255;
    }
  }
  return [r, g, b, a];
}

// ── LAVA PRESET (hardcoded) ───────────────────────────────────────────────────

const LAVA_PARAMS = {
  color1: "#FF9F21",
  color2: "#FF0303",
  color3: "#000000",
  rotation: 114,
  proportion: 100,
  scale: 0.52,
  speed: 30,
  distortion: 7,
  swirl: 18,
  swirlIterations: 20,
  softness: 100,
  offset: 717,
  shape: 2 as const, // Edge = 2
  shapeSize: 12,
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export interface AnimatedGradientProps {
  style?: CSSProperties;
  className?: string;
  /** Border radius to match parent pill shape */
  borderRadius?: string;
}

export function AnimatedGradient({
  style,
  className,
  borderRadius = "0px",
}: AnimatedGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIdRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !mounted) return;

    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) return;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, `#version 300 es\nin vec4 a_position;\nvoid main(){gl_Position=a_position;}`);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Geometry
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const U = {
      time:           gl.getUniformLocation(prog, "u_time"),
      res:            gl.getUniformLocation(prog, "u_resolution"),
      px:             gl.getUniformLocation(prog, "u_pixelRatio"),
      scale:          gl.getUniformLocation(prog, "u_scale"),
      rotation:       gl.getUniformLocation(prog, "u_rotation"),
      color1:         gl.getUniformLocation(prog, "u_color1"),
      color2:         gl.getUniformLocation(prog, "u_color2"),
      color3:         gl.getUniformLocation(prog, "u_color3"),
      proportion:     gl.getUniformLocation(prog, "u_proportion"),
      softness:       gl.getUniformLocation(prog, "u_softness"),
      shape:          gl.getUniformLocation(prog, "u_shape"),
      shapeScale:     gl.getUniformLocation(prog, "u_shapeScale"),
      distortion:     gl.getUniformLocation(prog, "u_distortion"),
      swirl:          gl.getUniformLocation(prog, "u_swirl"),
      swirlIter:      gl.getUniformLocation(prog, "u_swirlIterations"),
    };

    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    startTimeRef.current = performance.now();

    const p = LAVA_PARAMS;
    const c1 = hexToRgba(p.color1);
    const c2 = hexToRgba(p.color2);
    const c3 = hexToRgba(p.color3);

    const draw = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const speed = (p.speed / 100) * 5;

      gl.uniform1f(U.time, elapsed * speed + p.offset * 0.01);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.px, window.devicePixelRatio || 1);
      gl.uniform1f(U.scale, p.scale);
      gl.uniform1f(U.rotation, (p.rotation * Math.PI) / 180);
      gl.uniform4f(U.color1, ...c1);
      gl.uniform4f(U.color2, ...c2);
      gl.uniform4f(U.color3, ...c3);
      gl.uniform1f(U.proportion, p.proportion / 100);
      gl.uniform1f(U.softness, p.softness / 100);
      gl.uniform1f(U.shape, p.shape);
      gl.uniform1f(U.shapeScale, p.shapeSize / 100);
      gl.uniform1f(U.distortion, p.distortion / 50);
      gl.uniform1f(U.swirl, p.swirl / 100);
      gl.uniform1f(U.swirlIter, p.swirl === 0 ? 0 : p.swirlIterations);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frameIdRef.current = requestAnimationFrame(draw);
    };
    frameIdRef.current = requestAnimationFrame(draw);

    return () => {
      if (frameIdRef.current !== undefined) cancelAnimationFrame(frameIdRef.current);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius,
        overflow: "hidden",
        zIndex: 0,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}