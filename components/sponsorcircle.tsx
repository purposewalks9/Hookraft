"use client";

import { Users, Github, Code2, Zap, Heart, Star } from "lucide-react";

const placeholderItems = [
  { icon: Github, color: "#94a3b8" },
  { icon: Code2, color: "#fbbf24" },
  { icon: Zap, color: "#67e8f9" },
  { icon: Star, color: "#f472b6" },
  { icon: Heart, color: "#fb923c" },
  { icon: Users, color: "#60a5fa" },
];
export function SponsorsCircle() {
  const items = 10; // number of outer circles
  const dots = 24; // tiny outer dots

  return (
    <div className="py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto flex justify-center">
        
        {/* Container scales with screen */}
        <div className="relative w-[90vw] max-w-[620px] aspect-square">

          {/* Outer border */}
          <div className="absolute inset-0 rounded-full border border-border/50" />

          {/* Center circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[40%] aspect-square rounded-full border border-border/40 bg-card/60 flex items-center justify-center text-center p-4">
              <div>
                <div className="text-4xl md:text-6xl mb-2">🤝</div>
                <p className="text-sm md:text-base font-medium text-muted-foreground">
                  Be the first sponsor
                </p>
              </div>
            </div>
          </div>

          {/* Main empty circles */}
          {Array.from({ length: items }).map((_, index) => {
            const angle = (index * 2 * Math.PI) / items;

            return (
              <div
                key={index}
                className="absolute w-[12%] aspect-square rounded-full border border-border bg-card shadow-sm transition hover:scale-110"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * 38}%)`,
                  top: `calc(50% + ${Math.sin(angle) * 38}%)`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}

          {/* Small outer dots */}
          {Array.from({ length: dots }).map((_, i) => {
            const angle = (i * 2 * Math.PI) / dots;

            return (
              <div
                key={i}
                className="absolute w-[1.5%] aspect-square rounded-full bg-border/70"
                style={{
                  left: `calc(50% + ${Math.cos(angle) * 46}%)`,
                  top: `calc(50% + ${Math.sin(angle) * 46}%)`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}