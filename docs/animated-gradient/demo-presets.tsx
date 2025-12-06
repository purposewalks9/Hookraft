"use client";

import { useState } from "react";
import AnimatedGradient from "@/registry/spell-ui/animated-gradient";

const presets = ["Lava", "Prism", "Plasma", "Pulse", "Vortex", "Mist"] as const;

export function DemoPresets() {
  const [activePreset, setActivePreset] =
    useState<(typeof presets)[number]>("Lava");

  return (
    <div className="relative min-h-[500px] w-full md:min-h-[350px] flex flex-col">
      <AnimatedGradient style={{ zIndex: 0 }} config={{ preset: activePreset }} />
      <div className="relative z-10 flex gap-2 p-4 flex-wrap">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => setActivePreset(preset)}
            className={`px-3 py-1 text-sm font-medium tracking-tight cursor-pointer rounded-full transition-colors ${
              activePreset === preset
                ? "bg-white text-black"
                : "bg-transparent text-white"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <p className="text-4xl font-semibold tracking-tighter text-white mix-blend-exclusion">
          {activePreset}
        </p>
      </div>
    </div>
  );
}
