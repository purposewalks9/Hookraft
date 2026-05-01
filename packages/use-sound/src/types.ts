export type SoundName =
  | "click"
  | "hover"
  | "scroll"
  | "modal-open"
  | "modal-close"
  | "success"
  | "error"
  | "warning"
  | "toggle-on"
  | "toggle-off"
  | "notification"
  | "delete"
  | "expand"
  | "collapse"
  | "swipe"
  | "pop"
  | "minimize"
  | "maximize"
  | "typing"
  | "loading"
  | "complete"
  | "coin"

export type SoundTheme =
  | "soft"        // default — muted, gentle, iOS-like
  | "mechanical"  // keyboard / typewriter
  | "digital"     // crisp, synthetic, sci-fi
  | "wooden"      // warm, organic taps
  | "glass"       // bright, crystalline pings

export type HapticPattern =
  | "click"         // single short pulse — button press
  | "double"        // two quick pulses — toggle
  | "success"       // short-long — confirmation
  | "error"         // three rapid pulses — failure
  | "warning"       // two medium pulses — caution
  | "notification"  // single medium — incoming alert
  | "impact-light"  // barely there — hover
  | "impact-medium" // solid tap — selection
  | "impact-heavy"  // strong — destructive action
  | "selection"     // ultra-short tick — scroll item
  | "long"          // sustained — loading complete

export interface SoundOptions {
  volume?: number               // 0–1, default 0.3
  pitch?: "low" | "mid" | "high" | number  // number = Hz multiplier
  speed?: "slow" | "normal" | "fast"
  reverb?: boolean              // subtle room feel
  stereo?: number               // -1 to 1, default 0
  haptic?: boolean              // trigger haptic alongside sound, default false
  hapticPattern?: HapticPattern // override auto haptic pattern
}

export interface UseSoundOptions {
  globalVolume?: number         // 0–1, default 0.3
  muted?: boolean               // default false
  theme?: SoundTheme            // default "soft"
  haptics?: boolean             // enable haptics globally, default false
}

export interface UseSoundReturn {
  play: (name: SoundName, options?: SoundOptions) => void
  stop: (name?: SoundName) => void
  mute: () => void
  unmute: () => void
  isMuted: boolean
  isPlaying: (name: SoundName) => boolean
  triggerHaptic: (pattern: HapticPattern) => void
}