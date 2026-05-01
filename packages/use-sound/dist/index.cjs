'use strict';

var react = require('react');

// src/useSound.ts

// src/synth.ts
function createReverb(ctx) {
  const convolver = ctx.createConvolver();
  const length = ctx.sampleRate * 0.3;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  convolver.buffer = impulse;
  return convolver;
}
function buildChain(ctx, options, theme, baseFreq) {
  const vol = options.volume ?? 0.3;
  const stereo = options.stereo ?? 0;
  let pitchMult = theme.pitchMultiplier;
  if (options.pitch === "low") pitchMult *= 0.6;
  if (options.pitch === "high") pitchMult *= 1.6;
  if (options.pitch === "mid") pitchMult *= 1;
  if (typeof options.pitch === "number") pitchMult *= options.pitch;
  let speedMult = 1;
  if (options.speed === "fast") speedMult = 0.6;
  if (options.speed === "slow") speedMult = 1.8;
  const freq = baseFreq * pitchMult;
  const attack = theme.attackTime * speedMult;
  theme.decayTime * speedMult;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const panner = ctx.createStereoPanner();
  osc.type = theme.oscillatorType;
  osc.frequency.value = freq;
  filter.type = theme.filterType;
  filter.frequency.value = theme.filterFreq;
  filter.Q.value = theme.filterQ;
  panner.pan.value = stereo;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
  let last = osc;
  osc.connect(filter);
  last = filter;
  if (options.reverb) {
    const rev = createReverb(ctx);
    last.connect(rev);
    rev.connect(gain);
  } else {
    last.connect(gain);
  }
  gain.connect(panner);
  panner.connect(ctx.destination);
  return {
    osc,
    gain,
    start: () => osc.start(ctx.currentTime),
    stop: (t) => {
      gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.01);
    }
  };
}
var SOUNDS = {
  // ← namespace type
  click: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 1100);
    start();
    stop(0.045);
    return osc;
  },
  hover: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.12, ...opts }, theme, 900);
    start();
    stop(0.035);
    return osc;
  },
  scroll: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.1, ...opts }, theme, 800);
    start();
    stop(0.025);
    return osc;
  },
  "modal-open": (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 300);
    osc.frequency.linearRampToValueAtTime(900 * theme.pitchMultiplier, ctx.currentTime + 0.15);
    start();
    stop(0.18);
    return osc;
  },
  "modal-close": (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 900);
    osc.frequency.linearRampToValueAtTime(200 * theme.pitchMultiplier, ctx.currentTime + 0.15);
    start();
    stop(0.18);
    return osc;
  },
  success: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 600);
    osc.frequency.setValueAtTime(600 * theme.pitchMultiplier, ctx.currentTime);
    osc.frequency.setValueAtTime(900 * theme.pitchMultiplier, ctx.currentTime + 0.1);
    start();
    stop(0.22);
    return osc;
  },
  error: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.4, ...opts }, theme, 180);
    osc.frequency.linearRampToValueAtTime(120 * theme.pitchMultiplier, ctx.currentTime + 0.1);
    start();
    stop(0.14);
    return osc;
  },
  warning: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 440);
    osc.frequency.setValueAtTime(440 * theme.pitchMultiplier, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(380 * theme.pitchMultiplier, ctx.currentTime + 0.08);
    osc.frequency.linearRampToValueAtTime(440 * theme.pitchMultiplier, ctx.currentTime + 0.14);
    start();
    stop(0.18);
    return osc;
  },
  "toggle-on": (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 700);
    osc.frequency.linearRampToValueAtTime(1e3 * theme.pitchMultiplier, ctx.currentTime + 0.05);
    start();
    stop(0.07);
    return osc;
  },
  "toggle-off": (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 600);
    osc.frequency.linearRampToValueAtTime(350 * theme.pitchMultiplier, ctx.currentTime + 0.05);
    start();
    stop(0.07);
    return osc;
  },
  notification: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 880);
    osc.frequency.setValueAtTime(880 * theme.pitchMultiplier, ctx.currentTime);
    osc.frequency.setValueAtTime(1100 * theme.pitchMultiplier, ctx.currentTime + 0.08);
    start();
    stop(0.16);
    return osc;
  },
  delete: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.35, ...opts }, theme, 500);
    osc.frequency.exponentialRampToValueAtTime(80 * theme.pitchMultiplier, ctx.currentTime + 0.12);
    start();
    stop(0.14);
    return osc;
  },
  expand: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.18, ...opts }, theme, 400);
    osc.frequency.linearRampToValueAtTime(700 * theme.pitchMultiplier, ctx.currentTime + 0.1);
    start();
    stop(0.12);
    return osc;
  },
  collapse: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.18, ...opts }, theme, 700);
    osc.frequency.linearRampToValueAtTime(400 * theme.pitchMultiplier, ctx.currentTime + 0.1);
    start();
    stop(0.12);
    return osc;
  },
  swipe: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.2, ...opts }, theme, 600);
    osc.frequency.linearRampToValueAtTime(200 * theme.pitchMultiplier, ctx.currentTime + 0.08);
    start();
    stop(0.1);
    return osc;
  },
  pop: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 1400);
    osc.frequency.exponentialRampToValueAtTime(400 * theme.pitchMultiplier, ctx.currentTime + 0.04);
    start();
    stop(0.05);
    return osc;
  },
  minimize: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.2, ...opts }, theme, 800);
    osc.frequency.exponentialRampToValueAtTime(300 * theme.pitchMultiplier, ctx.currentTime + 0.07);
    start();
    stop(0.09);
    return osc;
  },
  maximize: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.2, ...opts }, theme, 300);
    osc.frequency.exponentialRampToValueAtTime(800 * theme.pitchMultiplier, ctx.currentTime + 0.07);
    start();
    stop(0.09);
    return osc;
  },
  typing: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.08, ...opts }, theme, 1e3);
    start();
    stop(0.02);
    return osc;
  },
  loading: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.06, ...opts }, theme, 500);
    osc.frequency.setValueAtTime(500 * theme.pitchMultiplier, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(520 * theme.pitchMultiplier, ctx.currentTime + 0.3);
    start();
    stop(0.35);
    return osc;
  },
  complete: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 500);
    osc.frequency.setValueAtTime(500 * theme.pitchMultiplier, ctx.currentTime);
    osc.frequency.setValueAtTime(700 * theme.pitchMultiplier, ctx.currentTime + 0.07);
    osc.frequency.setValueAtTime(900 * theme.pitchMultiplier, ctx.currentTime + 0.14);
    start();
    stop(0.25);
    return osc;
  },
  coin: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 988);
    osc.frequency.setValueAtTime(988 * theme.pitchMultiplier, ctx.currentTime);
    osc.frequency.setValueAtTime(1319 * theme.pitchMultiplier, ctx.currentTime + 0.08);
    start();
    stop(0.18);
    return osc;
  }
};

// src/themes.ts
var THEMES = {
  soft: {
    oscillatorType: "sine",
    attackTime: 2e-3,
    decayTime: 0.08,
    filterType: "lowpass",
    filterFreq: 2e3,
    filterQ: 0.7,
    pitchMultiplier: 1
  },
  mechanical: {
    oscillatorType: "square",
    attackTime: 1e-3,
    decayTime: 0.05,
    filterType: "bandpass",
    filterFreq: 1200,
    filterQ: 2,
    pitchMultiplier: 0.85
  },
  digital: {
    oscillatorType: "sawtooth",
    attackTime: 1e-3,
    decayTime: 0.06,
    filterType: "highpass",
    filterFreq: 800,
    filterQ: 1.5,
    pitchMultiplier: 1.2
  },
  wooden: {
    oscillatorType: "triangle",
    attackTime: 3e-3,
    decayTime: 0.12,
    filterType: "lowpass",
    filterFreq: 900,
    filterQ: 0.5,
    pitchMultiplier: 0.7
  },
  glass: {
    oscillatorType: "sine",
    attackTime: 1e-3,
    decayTime: 0.18,
    filterType: "peaking",
    filterFreq: 3e3,
    filterQ: 3,
    pitchMultiplier: 1.5
  }
};

// src/haptics.ts
var PATTERNS = {
  "click": 10,
  "double": [10, 50, 10],
  "success": [15, 40, 40],
  "error": [30, 20, 30, 20, 30],
  "warning": [20, 60, 20],
  "notification": 25,
  "impact-light": 5,
  "impact-medium": 15,
  "impact-heavy": 30,
  "selection": 8,
  "long": [10, 30, 10, 30, 40]
};
var SOUND_HAPTIC_MAP = {
  "click": "click",
  "hover": "impact-light",
  "scroll": "selection",
  "modal-open": "impact-medium",
  "modal-close": "impact-light",
  "success": "success",
  "error": "error",
  "warning": "warning",
  "toggle-on": "double",
  "toggle-off": "double",
  "notification": "notification",
  "delete": "impact-heavy",
  "expand": "impact-light",
  "collapse": "impact-light",
  "swipe": "impact-medium",
  "pop": "click",
  "minimize": "impact-light",
  "maximize": "impact-medium",
  "typing": "selection",
  "loading": "selection",
  "complete": "success",
  "coin": "double"
};
function triggerHaptic(pattern) {
  if (typeof navigator === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate(PATTERNS[pattern]);
}

// src/useSound.ts
function useSound(options = {}) {
  const {
    globalVolume = 0.3,
    muted: initialMuted = false,
    theme = "soft",
    haptics = false
  } = options;
  const [isMuted, setIsMuted] = react.useState(initialMuted);
  const ctxRef = react.useRef(null);
  const playingRef = react.useRef(/* @__PURE__ */ new Map());
  const loadingTimer = react.useRef(null);
  const prefersReduced = react.useRef(
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  );
  react.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => {
      prefersReduced.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  function getCtx() {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }
  const play = react.useCallback((name, opts = {}) => {
    if (isMuted || prefersReduced.current) return;
    const soundFn = SOUNDS[name];
    if (!soundFn) return;
    const ctx = getCtx();
    const envelope = THEMES[theme];
    const merged = { volume: globalVolume, ...opts };
    if (name === "loading") {
      if (loadingTimer.current) return;
      const tick = () => soundFn(ctx, merged, envelope);
      tick();
      loadingTimer.current = setInterval(tick, 400);
      return;
    }
    const osc = soundFn(ctx, merged, envelope);
    if (osc) playingRef.current.set(name, osc);
    const shouldHaptic = opts.haptic ?? haptics;
    if (shouldHaptic) {
      const pattern = opts.hapticPattern ?? SOUND_HAPTIC_MAP[name];
      triggerHaptic(pattern);
    }
  }, [isMuted, theme, globalVolume, haptics]);
  const stop = react.useCallback((name) => {
    if (name === "loading" || !name) {
      if (loadingTimer.current) {
        clearInterval(loadingTimer.current);
        loadingTimer.current = null;
      }
    }
    if (name) {
      const osc = playingRef.current.get(name);
      if (osc) {
        try {
          osc.stop();
        } catch {
        }
        playingRef.current.delete(name);
      }
    } else {
      playingRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {
        }
      });
      playingRef.current.clear();
    }
  }, []);
  const mute = react.useCallback(() => setIsMuted(true), []);
  const unmute = react.useCallback(() => setIsMuted(false), []);
  const isPlaying = react.useCallback((name) => {
    if (name === "loading") return loadingTimer.current !== null;
    return playingRef.current.has(name);
  }, []);
  const triggerHapticDirect = react.useCallback((pattern) => {
    triggerHaptic(pattern);
  }, []);
  react.useEffect(() => {
    return () => {
      if (loadingTimer.current) clearInterval(loadingTimer.current);
      ctxRef.current?.close();
    };
  }, []);
  return { play, stop, mute, unmute, isMuted, isPlaying, triggerHaptic: triggerHapticDirect };
}

exports.useSound = useSound;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map