import { HighlightedText } from "@/registry/spell-ui/highlighted-text";

export function Demo() {
  return (
    <div className="flex flex-col gap-6 text-xl font-semibold">
      <div>
        <HighlightedText from="left" delay={0} inView>
          From Left
        </HighlightedText>
      </div>
      <div>
        <HighlightedText from="right" delay={0.2} inView>
          From Right
        </HighlightedText>
      </div>
      <div>
        <HighlightedText from="top" delay={0.4} inView>
          From Top
        </HighlightedText>
      </div>
      <div>
        <HighlightedText from="bottom" delay={0.6} inView>
          From Bottom
        </HighlightedText>
      </div>
    </div>
  );
}
