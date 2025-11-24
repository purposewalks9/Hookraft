import { RandomizedText } from "@/registry/spell-ui/randomized-text";

export function Demo() {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="flex flex-col items-start gap-4 max-w-2xl px-4">
        <RandomizedText
          split="chars"
          className="text-2xl md:text-3xl font-semibold tracking-tighter"
        >
          Introducing Spell UI
        </RandomizedText>
        <RandomizedText className="text-base font-[550] tracking-tight text-muted-foreground">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Animi
          architecto soluta modi facilis fugit possimus commodi! Ipsam delectus
          unde repellendus.
        </RandomizedText>
      </div>
    </div>
  );
}
