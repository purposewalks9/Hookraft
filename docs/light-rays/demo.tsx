import Rays from "@/registry/spell-ui/light-rays";

export function Demo() {
  return (
    <div className="relative min-h-[500px] w-full md:min-h-[350px] flex items-center justify-center">
      <Rays style={{ zIndex: 0 }} />
      <div className="z-10 flex h-full text-white gap-2">
        <p className="text-4xl font-semibold tracking-tighter">Beautiful</p>
        <p className="text-4xl font-medium italic font-serif">Light Rays</p>
      </div>
    </div>
  );
}
