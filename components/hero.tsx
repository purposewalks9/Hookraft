import { BlurReveal } from "@/components/spell-ui/blur-reveal";
import { RichButton } from "@/components/spell-ui/rich-button";
import { CodePlayground } from "@/components/code-playground";
import Link from "next/link";

// ... codePreview string stays the same

export function Hero() {
  return (
    <div className="flex flex-col items-center w-full pt-6 pb-12 md:pt-14 md:pb-24 gap-12 md:gap-20 px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-[700px]">
        <BlurReveal letterSpacing="-0.020em" className="font-medium text-3xl md:text-4xl lg:text-5xl tracking-tight">
          Declarative lifecycle hooks for your React components.
        </BlurReveal>
        <p className="text-base  md:text-lg leading-6 text-muted-foreground">
         Stop scattering side effects across useEffect
          <br />
          Declare what happens when your UI enters, loads, or exits.
        </p>
        <div className="flex flex-row gap-3 mt-2 w-auto">
          <RichButton size="lg" className="transition-transform rounded-md tracking-tight active:scale-[0.97] will-change-transform ease-out duration-150 px-4" asChild>
            <Link href="/docs/introduction">Get Started</Link>
          </RichButton>
          <RichButton size="lg" color='yellow' className="transition-transform shadow-sm shadow-zinc-950/20 rounded-md tracking-tight px-4 active:scale-[0.97] will-change-transform ease-out duration-150" asChild>
            <Link href="/docs/doorway">Docs</Link>
          </RichButton>
        </div>
      </div>

      {/* Code playground below hero text */}
      <CodePlayground />
    </div>
  );
}