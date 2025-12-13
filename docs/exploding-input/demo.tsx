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
          <span key="1" className="text-4xl">🤩</span>,
          <span key="2" className="text-4xl">👾</span>,
          <span key="3" className="text-4xl">😺</span>,
          <span key="4" className="text-4xl">👻</span>,
          <span key="5" className="text-4xl">🎃</span>,
          <span key="6" className="text-4xl">🖤</span>,
          <span key="7" className="text-4xl">🗯️</span>,
        ]}
        direction={{ horizontal: "left", vertical: "top" }}
        gravity={0.5}
        duration={3}
        count={3}
      />
    </label>
  );
}
