"use client";

import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { RichButton } from "@/components/spell-ui/rich-button";
import Link from "next/link";

export default function NotFound() {
  const [firstDigit, setFirstDigit] = useState(() => Math.floor(Math.random() * 10));
  const [secondDigit, setSecondDigit] = useState(() => Math.floor(Math.random() * 10));
  const [thirdDigit, setThirdDigit] = useState(() => Math.floor(Math.random() * 10));

  useEffect(() => {
    const interval = setInterval(() => {
      setFirstDigit((prev) => (prev + 1) % 10);
      setSecondDigit((prev) => (prev + 1) % 10);
      setThirdDigit((prev) => (prev + 1) % 10);
    }, 100);

    const stopTimer = setTimeout(() => {
      clearInterval(interval);
      setFirstDigit(4);
      setTimeout(() => setSecondDigit(0), 200);
      setTimeout(() => setThirdDigit(4), 400);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(stopTimer);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 justify-center items-center h-svh">
      <div className="flex flex-col gap-8 max-w-[400px] px-6">
        <div className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
          Error
          <div className="flex gap-[0.5px]">
            <NumberFlow value={firstDigit} trend={-1} />
            <NumberFlow value={secondDigit} trend={-1} />
            <NumberFlow value={thirdDigit} trend={-1} />
          </div>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed">
          This page doesn&apos;t exist. You may have followed a broken link or
          typed the wrong URL.
        </p>

        <RichButton
          className="rounded-full pl-3 gap-1.5 active:scale-[0.97] will-change-transform ease-out duration-300 w-fit"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="size-4" /> Go Back
          </Link>
        </RichButton>
      </div>
    </div>
  );
}