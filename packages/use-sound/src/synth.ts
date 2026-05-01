import { useSound } from "./useSound"
import { THEMES, ThemeEnvelope } from "./themes"

// Shared impulse response generator for reverb
function createReverb(ctx: AudioContext): ConvolverNode {
  const convolver = ctx.createConvolver()
  const length    = ctx.sampleRate * 0.3
  const impulse   = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5)
    }
  }
  convolver.buffer = impulse
  return convolver
}

function buildChain(
  ctx: AudioContext,
  options: useSound.Options,       // ← namespace type
  theme: ThemeEnvelope,
  baseFreq: number,
): { osc: OscillatorNode; gain: GainNode; start: () => void; stop: (t: number) => void } {
  const vol    = options.volume ?? 0.3
  const stereo = options.stereo ?? 0

  let pitchMult = theme.pitchMultiplier
  if (options.pitch === "low")               pitchMult *= 0.6
  if (options.pitch === "high")              pitchMult *= 1.6
  if (options.pitch === "mid")               pitchMult *= 1.0
  if (typeof options.pitch === "number")     pitchMult *= options.pitch

  let speedMult = 1
  if (options.speed === "fast") speedMult = 0.6
  if (options.speed === "slow") speedMult = 1.8

  const freq   = baseFreq * pitchMult
  const attack = theme.attackTime * speedMult
  const decay  = theme.decayTime  * speedMult

  const osc    = ctx.createOscillator()
  const gain   = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  const panner = ctx.createStereoPanner()

  osc.type               = theme.oscillatorType
  osc.frequency.value    = freq
  filter.type            = theme.filterType as BiquadFilterType
  filter.frequency.value = theme.filterFreq
  filter.Q.value         = theme.filterQ
  panner.pan.value       = stereo

  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack)

  let last: AudioNode = osc
  osc.connect(filter)
  last = filter

  if (options.reverb) {
    const rev = createReverb(ctx)
    last.connect(rev)
    rev.connect(gain)
  } else {
    last.connect(gain)
  }

  gain.connect(panner)
  panner.connect(ctx.destination)

  return {
    osc,
    gain,
    start: () => osc.start(ctx.currentTime),
    stop:  (t) => {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.01)
    },
  }
}

// ── SOUND DEFINITIONS ────────────────────────────────────────────────────────

type SoundFn = (
  ctx: AudioContext,
  opts: useSound.Options,          // ← namespace type
  theme: ThemeEnvelope
) => OscillatorNode | null

export const SOUNDS: Record<useSound.SoundName, SoundFn> = {  // ← namespace type

  click: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 1100)
    start(); stop(0.045)
    return osc
  },

  hover: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.12, ...opts }, theme, 900)
    start(); stop(0.035)
    return osc
  },

  scroll: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.1, ...opts }, theme, 800)
    start(); stop(0.025)
    return osc
  },

  "modal-open": (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 300)
    osc.frequency.linearRampToValueAtTime(900 * theme.pitchMultiplier, ctx.currentTime + 0.15)
    start(); stop(0.18)
    return osc
  },

  "modal-close": (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 900)
    osc.frequency.linearRampToValueAtTime(200 * theme.pitchMultiplier, ctx.currentTime + 0.15)
    start(); stop(0.18)
    return osc
  },

  success: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 600)
    osc.frequency.setValueAtTime(600 * theme.pitchMultiplier, ctx.currentTime)
    osc.frequency.setValueAtTime(900 * theme.pitchMultiplier, ctx.currentTime + 0.1)
    start(); stop(0.22)
    return osc
  },

  error: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.4, ...opts }, theme, 180)
    osc.frequency.linearRampToValueAtTime(120 * theme.pitchMultiplier, ctx.currentTime + 0.1)
    start(); stop(0.14)
    return osc
  },

  warning: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 440)
    osc.frequency.setValueAtTime(440 * theme.pitchMultiplier, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(380 * theme.pitchMultiplier, ctx.currentTime + 0.08)
    osc.frequency.linearRampToValueAtTime(440 * theme.pitchMultiplier, ctx.currentTime + 0.14)
    start(); stop(0.18)
    return osc
  },

  "toggle-on": (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 700)
    osc.frequency.linearRampToValueAtTime(1000 * theme.pitchMultiplier, ctx.currentTime + 0.05)
    start(); stop(0.07)
    return osc
  },

  "toggle-off": (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 600)
    osc.frequency.linearRampToValueAtTime(350 * theme.pitchMultiplier, ctx.currentTime + 0.05)
    start(); stop(0.07)
    return osc
  },

  notification: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 880)
    osc.frequency.setValueAtTime(880  * theme.pitchMultiplier, ctx.currentTime)
    osc.frequency.setValueAtTime(1100 * theme.pitchMultiplier, ctx.currentTime + 0.08)
    start(); stop(0.16)
    return osc
  },

  delete: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.35, ...opts }, theme, 500)
    osc.frequency.exponentialRampToValueAtTime(80 * theme.pitchMultiplier, ctx.currentTime + 0.12)
    start(); stop(0.14)
    return osc
  },

  expand: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.18, ...opts }, theme, 400)
    osc.frequency.linearRampToValueAtTime(700 * theme.pitchMultiplier, ctx.currentTime + 0.1)
    start(); stop(0.12)
    return osc
  },

  collapse: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.18, ...opts }, theme, 700)
    osc.frequency.linearRampToValueAtTime(400 * theme.pitchMultiplier, ctx.currentTime + 0.1)
    start(); stop(0.12)
    return osc
  },

  swipe: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.2, ...opts }, theme, 600)
    osc.frequency.linearRampToValueAtTime(200 * theme.pitchMultiplier, ctx.currentTime + 0.08)
    start(); stop(0.1)
    return osc
  },

  pop: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 1400)
    osc.frequency.exponentialRampToValueAtTime(400 * theme.pitchMultiplier, ctx.currentTime + 0.04)
    start(); stop(0.05)
    return osc
  },

  minimize: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.2, ...opts }, theme, 800)
    osc.frequency.exponentialRampToValueAtTime(300 * theme.pitchMultiplier, ctx.currentTime + 0.07)
    start(); stop(0.09)
    return osc
  },

  maximize: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.2, ...opts }, theme, 300)
    osc.frequency.exponentialRampToValueAtTime(800 * theme.pitchMultiplier, ctx.currentTime + 0.07)
    start(); stop(0.09)
    return osc
  },

  typing: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.08, ...opts }, theme, 1000)
    start(); stop(0.02)
    return osc
  },

  loading: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, { volume: 0.06, ...opts }, theme, 500)
    osc.frequency.setValueAtTime(500 * theme.pitchMultiplier, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(520 * theme.pitchMultiplier, ctx.currentTime + 0.3)
    start(); stop(0.35)
    return osc
  },

  complete: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 500)
    osc.frequency.setValueAtTime(500 * theme.pitchMultiplier, ctx.currentTime)
    osc.frequency.setValueAtTime(700 * theme.pitchMultiplier, ctx.currentTime + 0.07)
    osc.frequency.setValueAtTime(900 * theme.pitchMultiplier, ctx.currentTime + 0.14)
    start(); stop(0.25)
    return osc
  },

  coin: (ctx, opts, theme) => {
    const { osc, start, stop } = buildChain(ctx, opts, theme, 988)
    osc.frequency.setValueAtTime(988  * theme.pitchMultiplier, ctx.currentTime)
    osc.frequency.setValueAtTime(1319 * theme.pitchMultiplier, ctx.currentTime + 0.08)
    start(); stop(0.18)
    return osc
  },
}