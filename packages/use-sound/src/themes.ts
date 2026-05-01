import type { SoundTheme } from "./types"

export interface ThemeEnvelope {
  oscillatorType: OscillatorType   // sine | square | sawtooth | triangle
  attackTime: number               // seconds
  decayTime: number                // seconds
  filterType: BiquadFilterType
  filterFreq: number               // Hz
  filterQ: number
  pitchMultiplier: number          // scales all base frequencies
}

export const THEMES: Record<SoundTheme, ThemeEnvelope> = {
  soft: {
    oscillatorType: "sine",
    attackTime:     0.002,
    decayTime:      0.08,
    filterType:     "lowpass",
    filterFreq:     2000,
    filterQ:        0.7,
    pitchMultiplier: 1,
  },
  mechanical: {
    oscillatorType: "square",
    attackTime:     0.001,
    decayTime:      0.05,
    filterType:     "bandpass",
    filterFreq:     1200,
    filterQ:        2,
    pitchMultiplier: 0.85,
  },
  digital: {
    oscillatorType: "sawtooth",
    attackTime:     0.001,
    decayTime:      0.06,
    filterType:     "highpass",
    filterFreq:     800,
    filterQ:        1.5,
    pitchMultiplier: 1.2,
  },
  wooden: {
    oscillatorType: "triangle",
    attackTime:     0.003,
    decayTime:      0.12,
    filterType:     "lowpass",
    filterFreq:     900,
    filterQ:        0.5,
    pitchMultiplier: 0.7,
  },
  glass: {
    oscillatorType: "sine",
    attackTime:     0.001,
    decayTime:      0.18,
    filterType:     "peaking",
    filterFreq:     3000,
    filterQ:        3,
    pitchMultiplier: 1.5,
  },
}