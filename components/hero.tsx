import { BlurReveal } from "@/components/spell-ui/blur-reveal";
import { RichButton } from "@/components/spell-ui/rich-button";
import Link from "next/link";
export function Hero() {
  return (
    <div className="flex flex-col items-center w-full pt-6 pb-12 md:pt-14 md:pb-24 gap-8 md:gap-16 px-4">
      <div className="flex flex-col items-center text-center gap-6 max-w-[700px]">
        <BlurReveal letterSpacing="-0.020em" className="font-medium text-3xl md:text-4xl lg:text-5xl tracking-tight">
          Refined UI components for Design Engineers
        </BlurReveal>
        <p className="text-base md:text-lg leading-6 text-muted-foreground">
          A large collection of high-quality React components that
          <br />
          you can copy and paste into any project.
        </p>
        <div className="flex flex-row gap-3 mt-2 w-auto">
          <RichButton size="lg" className="transition-transform rounded-full trakcing-tight active:scale-[0.97] will-change-transform ease-out duration-150 px-4.5" asChild>
            <Link href={"/docs/introduction"}>Get Started</Link>
          </RichButton>
          <RichButton size="lg" color="blue" className="transition-transform shadow-sm shadow-zinc-950/20 group rounded-full [&_svg]:size-4.5 trakcing-tight px-4 active:scale-[0.97] will-change-transform ease-out duration-150" asChild>
            <Link href={"/docs/blur-reveal"}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><g fill="currentColor"><circle cx="14.5" cy="8.5" r="2.5" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></circle><rect x="5" y="12" width="5" height="5" rx="1" ry="1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="currentColor"></rect><path d="m5.1889,3.7146l-2.1169,3.5282c-.2.3333.0401.7572.4287.7572h4.2338c.3886,0,.6287-.424.4287-.7572l-2.1169-3.5282c-.1942-.3237-.6633-.3237-.8575,0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="currentColor"></path></g></svg>
              Components
            </Link>
          </RichButton>
        </div>
      </div>
    </div>
  );
}
