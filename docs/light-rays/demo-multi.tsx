import Rays from "@/registry/spell-ui/light-rays";

export function DemoMulti() {
  return (
    <div className="relative min-h-[500px] w-full md:min-h-[350px] flex items-center justify-center">
      <Rays
        style={{ zIndex: 0 }}
        raysColor={{ mode: "multi", color1: "#2060DF", color2: "#ffffff" }}
      />
      <div className="z-10 flex flex-col items-center h-full text-white gap-2">
        <p className="text-4xl font-semibold tracking-tighter">Multi Colored</p>
        <p className="text-4xl font-medium italic font-serif">Light Rays</p>
      </div>
    </div>
  );
}
