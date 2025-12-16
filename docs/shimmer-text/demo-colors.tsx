import { ShimmerText } from "@/registry/spell-ui/shimmer-text";

export function Demo() {
  return (
    <div className="flex flex-col gap-4 font-medium">
      <ShimmerText variant="blue">
        Thinking longer for a better answer
      </ShimmerText>
      <ShimmerText variant="green">
        Thinking longer for a better answer
      </ShimmerText>
      <ShimmerText variant="purple">
        Thinking longer for a better answer
      </ShimmerText>
      <ShimmerText variant="rose">
        Thinking longer for a better answer
      </ShimmerText>
    </div>
  );
}
