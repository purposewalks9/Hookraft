"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LogosCarouselProps {
  children: React.ReactNode;
  stagger?: number;
  count?: number;
  className?: string;
  gap?: number;
  duration?: number;
  interval?: number;
  initialDelay?: number;
}

export function LogosCarousel({
  children,
  stagger = 0.14,
  count,
  className,
  gap = 10,
  duration = 600,
  interval = 2500,
  initialDelay = 500,
}: LogosCarouselProps) {
  const [index, setIndex] = React.useState(0);
  const [animate, setAnimate] = React.useState(false);

  // Convert children to array and group them
  const childrenArray = React.Children.toArray(children);
  const logosPerGroup = count || childrenArray.length;
  const groups: React.ReactNode[][] = [];
  
  for (let i = 0; i < childrenArray.length; i += logosPerGroup) {
    groups.push(childrenArray.slice(i, i + logosPerGroup));
  }

  if (groups.length === 0) {
    return null;
  }

  const [nextIndex, setNextIndex] = React.useState(1);

  React.useEffect(() => {
    const id = setTimeout(() => {
      setAnimate(true);
    }, initialDelay);

    return () => {
      clearTimeout(id);
    };
  }, [initialDelay]);

  React.useEffect(() => {
    if (!animate || groups.length === 0) {
      return;
    }

    function loop() {
      setIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % groups.length;
        setNextIndex((newIndex + 1) % groups.length);
        return newIndex;
      });
    }

    const intervalId = setInterval(loop, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [animate, interval, groups.length]);

  return (
    <>
      <style jsx>{`
        @keyframes logos-enter {
          0% {
            transform: translateY(40px);
            filter: blur(4px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            filter: blur(0px);
            opacity: 1;
          }
        }

        @keyframes logos-exit {
          0% {
            transform: translateY(0);
            filter: blur(0px);
            opacity: 1;
          }
          100% {
            transform: translateY(-40px);
            filter: blur(4px);
            opacity: 0;
          }
        }
      `}</style>
      <div
        className={cn(
          "max-w-[720px] grid place-items-center w-full",
          className,
        )}
      >
        {groups.map((group, groupIndex) => {
          const isCurrent = groupIndex === index;
          const isNext = groupIndex === nextIndex && animate;
          const isVisible = isCurrent || isNext;

          return (
            <div
              key={groupIndex}
              className="flex w-full justify-center"
              style={{ 
                gridArea: "1 / 1", 
                gap: `${gap * 0.25}rem`,
                pointerEvents: isVisible ? "auto" : "none",
              }}
            >
              {group.map((logo, logoIndex) => {
                return (
                  <Logo
                    key={logoIndex}
                    state={isCurrent ? "exit" : "enter"}
                    animate={animate && isVisible}
                    index={logoIndex}
                    stagger={stagger}
                    duration={duration}
                  >
                    {logo}
                  </Logo>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

interface LogoProps {
  children: React.ReactNode;
  animate?: boolean;
  index: number;
  state?: "enter" | "exit";
  stagger?: number;
  duration?: number;
}

function Logo({
  children,
  animate,
  index,
  state = "enter",
  stagger = 0.14,
  duration = 500,
}: LogoProps) {
  const delay = index * stagger;
  const durationMs = duration;

  const animationStyles: React.CSSProperties = {
    animationDelay: `${delay}s`,
    animationDuration: `${durationMs}ms`,
    animationFillMode: "both",
  };

  if (!animate) {
    if (state === "enter") {
      return (
        <div
          className="opacity-0"
          style={animationStyles}
        >
          {children}
        </div>
      );
    }
    return (
      <div
        className="opacity-100"
        style={animationStyles}
      >
        {children}
      </div>
    );
  }

  const animationName = state === "enter" ? "logos-enter" : "logos-exit";

  return (
    <div
      style={{
        ...animationStyles,
        animationName,
        animationTimingFunction: "ease",
      }}
    >
      {children}
    </div>
  );
}

export default LogosCarousel;
