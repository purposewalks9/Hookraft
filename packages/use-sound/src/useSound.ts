"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { SOUNDS } from "./synth"
import { THEMES } from "./themes"
import { triggerHaptic, SOUND_HAPTIC_MAP } from "./haptics"

export declare namespace useSound {

    type SoundName =
        | "click" | "hover" | "scroll"
        | "modal-open" | "modal-close"
        | "success" | "error" | "warning"
        | "toggle-on" | "toggle-off"
        | "notification" | "delete"
        | "expand" | "collapse"
        | "swipe" | "pop"
        | "minimize" | "maximize"
        | "typing" | "loading" | "complete" | "coin"

    type Theme =
        | "soft"
        | "mechanical"
        | "digital"
        | "wooden"
        | "glass"

    type HapticPattern =
        | "click"
        | "double"
        | "success"
        | "error"
        | "warning"
        | "notification"
        | "impact-light"
        | "impact-medium"
        | "impact-heavy"
        | "selection"
        | "long"

    interface Options {
        volume?: number
        pitch?: "low" | "mid" | "high" | number
        speed?: "slow" | "normal" | "fast"
        reverb?: boolean
        stereo?: number
        haptic?: boolean
        hapticPattern?: HapticPattern
    }

    interface GlobalOptions {
        globalVolume?: number
        muted?: boolean
        theme?: Theme
        haptics?: boolean
    }

    interface Return {
        play: (name: SoundName, options?: Options) => void
        stop: (name?: SoundName) => void
        mute: () => void
        unmute: () => void
        isMuted: boolean
        isPlaying: (name: SoundName) => boolean
        triggerHaptic: (pattern: HapticPattern) => void
    }
}

export function useSound(options: useSound.GlobalOptions = {}): useSound.Return {
    const {
        globalVolume = 0.3,
        muted: initialMuted = false,
        theme = "soft",
        haptics = false,
    } = options

    const [isMuted, setIsMuted] = useState(initialMuted)

    const ctxRef = useRef<AudioContext | null>(null)
    const playingRef = useRef<Map<useSound.SoundName, OscillatorNode>>(new Map())
    const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null)

    const prefersReduced = useRef(
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false
    )

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const handler = (e: MediaQueryListEvent) => { prefersReduced.current = e.matches }
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])

    function getCtx(): AudioContext {
        if (!ctxRef.current || ctxRef.current.state === "closed") {
            ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        if (ctxRef.current.state === "suspended") {
            ctxRef.current.resume()
        }
        return ctxRef.current
    }

    const play = useCallback((name: useSound.SoundName, opts: useSound.Options = {}) => {
        if (isMuted || prefersReduced.current) return

        const soundFn = SOUNDS[name]
        if (!soundFn) return

        const ctx = getCtx()
        const envelope = THEMES[theme]
        const merged = { volume: globalVolume, ...opts }

        if (name === "loading") {
            if (loadingTimer.current) return
            const tick = () => soundFn(ctx, merged, envelope)
            tick()
            loadingTimer.current = setInterval(tick, 400)
            return
        }

        const osc = soundFn(ctx, merged, envelope)
        if (osc) playingRef.current.set(name, osc)

        const shouldHaptic = opts.haptic ?? haptics
        if (shouldHaptic) {
            const pattern = opts.hapticPattern ?? SOUND_HAPTIC_MAP[name]
            triggerHaptic(pattern)
        }
    }, [isMuted, theme, globalVolume, haptics])

    const stop = useCallback((name?: useSound.SoundName) => {
        if (name === "loading" || !name) {
            if (loadingTimer.current) {
                clearInterval(loadingTimer.current)
                loadingTimer.current = null
            }
        }
        if (name) {
            const osc = playingRef.current.get(name)
            if (osc) {
                try { osc.stop() } catch { }
                playingRef.current.delete(name)
            }
        } else {
            playingRef.current.forEach((osc) => { try { osc.stop() } catch { } })
            playingRef.current.clear()
        }
    }, [])

    const mute = useCallback(() => setIsMuted(true), [])
    const unmute = useCallback(() => setIsMuted(false), [])

    const isPlaying = useCallback((name: useSound.SoundName) => {
        if (name === "loading") return loadingTimer.current !== null
        return playingRef.current.has(name)
    }, [])

    const triggerHapticDirect = useCallback((pattern: useSound.HapticPattern) => {
        triggerHaptic(pattern)
    }, [])

    useEffect(() => {
        return () => {
            if (loadingTimer.current) clearInterval(loadingTimer.current)
            ctxRef.current?.close()
        }
    }, [])

    return { play, stop, mute, unmute, isMuted, isPlaying, triggerHaptic: triggerHapticDirect }
}