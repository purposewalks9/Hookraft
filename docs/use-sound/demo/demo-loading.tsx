"use client"

import { useState, useEffect } from "react"
import { useSound }             from "@hookraft/use-sound"

export function DemoLoading() {
  const [loading, setLoading] = useState(false)
  const { play, stop, isPlaying } = useSound({ theme: "digital" })

  useEffect(() => {
    if (loading) {
      play("loading")
      const timer = setTimeout(() => {
        stop("loading")
        play("complete")
        setLoading(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [loading])

  return (
    <button
      onMouseDown={() => !loading && setLoading(true)}
      className="rounded-lg bg-foreground px-4 py-2 text-sm text-background"
    >
      {loading ? "Loading…" : "Start"}
    </button>
  )
}

