"use client"

import { useState } from "react"
import { useSound } from "@hookraft/use-sound"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Bell, Palette, Users, CreditCard, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

type Item = {
  id: number
  name: string
  role: string
  status: "active" | "idle" | "offline"
}

const ITEMS: Item[] = [
  { id: 1, name: "Aria Chen",     role: "Frontend Dev",    status: "active"  },
  { id: 2, name: "Marcus Webb",   role: "Copywriter",      status: "idle"    },
  { id: 3, name: "Zoe Adeyemi",   role: "Designer",        status: "active"  },
  { id: 4, name: "Liam Okafor",   role: "Backend Dev",     status: "offline" },
  { id: 5, name: "Sofia Brennan", role: "Product Manager", status: "active"  },
  { id: 6, name: "Kai Nakamura",  role: "DevOps",          status: "idle"    },
]

const STATUS_COLOR: Record<Item["status"], string> = {
  active:  "bg-green-500",
  idle:    "bg-yellow-400",
  offline: "bg-muted-foreground/30",
}

export function DemoList() {
  const [selected, setSelected] = useState<number | null>(null)
  const [log, setLog] = useState<string[]>([])
  const { play, isMuted, mute, unmute } = useSound({ theme: "soft" })

  const push = (msg: string) => setLog((l) => [msg, ...l].slice(0, 4))

  const handleAction = (label: string) => {
    play("click")
    push(`clicked — ${label}`)
  }

  // Top-level menu hover: default hover, mid pitch, normal volume
  const hoverTop = () => play("hover", { pitch: "mid", volume: 0.12 })

  // Submenu (members) hover: higher pitch, softer, faster — feels shallower/lighter
  const hoverSub = () => play("hover", { pitch: "high", volume: 0.07, speed: "fast" })

  return (
    <div className="flex flex-col gap-4 p-6 max-w-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onMouseEnter={() => play("pop", { volume: 0.08 })}
          >
            <Settings className="size-4" />
            Settings
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-52">
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>

          <DropdownMenuItem onMouseEnter={hoverTop} onSelect={() => handleAction("Profile settings")}>
            Profile settings
          </DropdownMenuItem>
          <DropdownMenuItem onMouseEnter={hoverTop} onSelect={() => handleAction("Notifications")}>
            <Bell className="size-4" />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem onMouseEnter={hoverTop} onSelect={() => handleAction("Appearance")}>
            <Palette className="size-4" />
            Appearance
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Team</DropdownMenuLabel>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger onMouseEnter={() => play("expand", { volume: 0.1 })}>
              <Users className="size-4" />
              Members
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {ITEMS.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onMouseEnter={hoverSub}
                  onSelect={() => {
                    play("click", { pitch: "high", volume: 0.1 })
                    setSelected(item.id)
                    push(`selected — ${item.name}`)
                  }}
                  className="gap-3"
                >
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                      {item.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background ${STATUS_COLOR[item.status]}`} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{item.role}</span>
                  </div>

                  {selected === item.id && (
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">selected</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onMouseEnter={hoverTop} onSelect={() => handleAction("Billing")}>
            <CreditCard className="size-4" />
            Billing
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onMouseEnter={() => play("hover", { pitch: "low", volume: 0.1 })}
            onSelect={() => handleAction("Sign out")}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); isMuted ? unmute() : mute() }}>
            <span className="text-xs font-mono text-muted-foreground">
              {isMuted ? "🔇 unmute sounds" : "🔊 mute sounds"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="rounded-lg border border-border bg-muted/30 p-3 min-h-[72px]">
        {log.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">Open the menu and click something...</p>
        ) : (
          log.map((entry, i) => (
            <p key={i} className={`text-xs font-mono ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
              › {entry}
            </p>
          ))
        )}
      </div>
    </div>
  )
}