"use client"

import { useRef }    from "react"
import { useSound }  from "@hookraft/use-sound"

export function DemoScroll() {
  const { play }   = useSound({ theme: "mechanical" })
  const lastFired  = useRef(0)

  const handleScroll = () => {
    const now = Date.now()
    if (now - lastFired.current < 80) return
    lastFired.current = now
    play("scroll")
  }

  return (
    <ul
      onScroll={handleScroll}
      className="h-48 overflow-y-auto rounded-lg border divide-y"
    >
      {Array.from({ length: 30 }, (_, i) => (
        <li key={i} className="px-4 py-2 text-sm">
          Item {i + 1}
        </li>
      ))}
    </ul>
  )
}