"use client";

import { BlurReveal } from "@/components/spell-ui/blur-reveal";
import { RichButton } from "@/components/spell-ui/rich-button";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col items-center w-full pb-12 md:pb-24 gap-8 md:gap-16 px-4">
      <section className="relative flex flex-col items-center justify-center pb-20 px-4 text-center w-full max-w-[1400px] overflow-hidden bg-background">

        {/* Subtle Grid Background - Works in both themes */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Soft Glow - Only visible in dark mode */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-yellow-500/10 dark:bg-yellow-600/10 blur-[100px]" />

        <div className="flex flex-col items-center w-full pt-6 pb-6 md:pt-14 md:pb-24 gap-12 md:gap-20 px-4">
          <div className="flex flex-col items-center text-center gap-6 max-w-[700px]">
            <BlurReveal
              letterSpacing="-0.020em"
              className="font-medium text-3xl md:text-4xl lg:text-5xl tracking-tight text-foreground"
            >
              Declarative custom hooks for your React components.
            </BlurReveal>

            <p className="text-base md:text-lg leading-6 text-muted-foreground">
              Focus on building your UI, while Hookraft takes care of the logic.
            </p>

            <div className="flex flex-row gap-3 mt-2 w-auto">
              <RichButton
                size="lg"
                className="transition-transform rounded-md tracking-tight active:scale-[0.97] will-change-transform ease-out duration-150 px-6"
                asChild
              >
                <Link href="/docs/introduction">Get Started</Link>
              </RichButton>

              <RichButton
                size="lg"
                color="yellow"
                className="transition-transform shadow-sm shadow-zinc-950/20 rounded-md tracking-tight px-6 active:scale-[0.97] will-change-transform ease-out duration-150"
                asChild
              >
                <Link href="/docs/doorway">Docs</Link>
              </RichButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}