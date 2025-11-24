import { RichButton } from "@/registry/spell-ui/rich-button";

export function Demo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <RichButton size="sm">Small</RichButton>
      <RichButton size="default">Default</RichButton>
      <RichButton size="lg">Large</RichButton>
    </div>
  );
}
