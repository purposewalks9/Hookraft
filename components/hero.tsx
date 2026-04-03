"use client";

import { BlurReveal } from "@/components/spell-ui/blur-reveal";
import { RichButton } from "@/components/spell-ui/rich-button";
import Link from "next/link";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/10 dark:hover:bg-white/5"
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M1 4h2v6a1 1 0 001 1h5v1H3a2 2 0 01-2-2V4z" fill="currentColor" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

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
              Declarative lifecycle hooks for your React components.
            </BlurReveal>

            <p className="text-base md:text-lg leading-6 text-muted-foreground">
              Stop scattering side effects across useEffect
              <br />
              Declare what happens when your UI enters, loads, or exits.
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

        {/* Install Command Box - Theme aware */}
        <div className="relative w-full max-w-sm">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3.5 shadow-sm">
            <span className="font-mono text-sm text-muted-foreground">
              <span className="text-foreground">$</span> npm install hookraft
            </span>
            <CopyButton text="npm install hookraft" />
          </div>
        </div>
      </section>
    </div>
  );
}