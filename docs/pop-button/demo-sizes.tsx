import { PopButton } from "@/registry/spell-ui/pop-button";

export function Demo() {
  return (
    <div className="flex not-sm:flex-col flex-wrap items-center gap-4 font-semibold">
      <PopButton size="sm" color="violet">Small</PopButton>
      <PopButton size="default" color="violet">Default</PopButton>
      <PopButton size="lg" color="violet">Large</PopButton>
    </div>
  );
}