import AnimatedGradient from "@/registry/spell-ui/animated-gradient";

export function Demo() {
  return (
    <div className="relative min-h-[500px] w-full md:min-h-[350px] flex items-center justify-center">
      <div className="z-10 flex flex-col items-center text-white gap-1">
        <p className="text-4xl font-semibold tracking-tighter">Animated</p>
        <p className="text-4xl font-medium italic font-serif">Gradient</p>
      </div>
      <AnimatedGradient style={{ zIndex: 0 }} config={{ preset: "Prism" }} />
    </div>
  );
}
