import { HighlightedText } from "@/registry/spell-ui/highlighted-text";

export function Demo() {
  return (
    <div className="text-2xl md:text-4xl font-medium tracking-[-.03em] flex items-center">
      You&nbsp;<HighlightedText>can</HighlightedText>&nbsp;just&nbsp;
      <HighlightedText delay={0.4} from="left">ship things.</HighlightedText>
    </div>
  );
}
