declare namespace useSound {
    type SoundName = "click" | "hover" | "scroll" | "modal-open" | "modal-close" | "success" | "error" | "warning" | "toggle-on" | "toggle-off" | "notification" | "delete" | "expand" | "collapse" | "swipe" | "pop" | "minimize" | "maximize" | "typing" | "loading" | "complete" | "coin";
    type Theme = "soft" | "mechanical" | "digital" | "wooden" | "glass";
    type HapticPattern = "click" | "double" | "success" | "error" | "warning" | "notification" | "impact-light" | "impact-medium" | "impact-heavy" | "selection" | "long";
    interface Options {
        volume?: number;
        pitch?: "low" | "mid" | "high" | number;
        speed?: "slow" | "normal" | "fast";
        reverb?: boolean;
        stereo?: number;
        haptic?: boolean;
        hapticPattern?: HapticPattern;
    }
    interface GlobalOptions {
        globalVolume?: number;
        muted?: boolean;
        theme?: Theme;
        haptics?: boolean;
    }
    interface Return {
        play: (name: SoundName, options?: Options) => void;
        stop: (name?: SoundName) => void;
        mute: () => void;
        unmute: () => void;
        isMuted: boolean;
        isPlaying: (name: SoundName) => boolean;
        triggerHaptic: (pattern: HapticPattern) => void;
    }
}
declare function useSound(options?: useSound.GlobalOptions): useSound.Return;

export { useSound };
