"use client";

import { ExplodingInput } from "@/registry/spell-ui/exploding-input";

export function Demo() {
  return (
    <label className="block">
      <input
        type="text"
        placeholder="try@spell.here"
        className="w-72 p-0 h-10 text-base border-b bg-background font-medium placeholder:font-medium outline-none"
      />
      <ExplodingInput
      className="z-50"
        content={[
          <img key="1" src="https://spell.sh/emojis/bell.avif" alt="bell" className="size-10" />,
          <img key="2" src="https://spell.sh/emojis/cursor.avif" alt="cursor" className="size-10" />,
          <img key="3" src="https://spell.sh/emojis/heart.avif" alt="heart" className="size-10" />,
          <img key="4" src="https://spell.sh/emojis/image.avif" alt="image" className="size-10" />,
          <img key="5" src="https://spell.sh/emojis/money.avif" alt="money" className="size-10" />,
          <img key="6" src="https://spell.sh/emojis/shaka.avif" alt="shaka" className="size-10" />,
          <img key="7" src="https://spell.sh/emojis/smile.avif" alt="smile" className="size-10" />,
          <img key="8" src="https://spell.sh/emojis/thumbsup.avif" alt="thumbsup" className="size-10" />,
        ]}
        direction={{ horizontal: "left", vertical: "top" }}
        gravity={0.5}
        duration={3}
        count={3}
      />
    </label>
  );
}
