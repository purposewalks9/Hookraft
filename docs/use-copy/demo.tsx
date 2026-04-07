"use client"

import { useRef, useState } from "react"
import { useCopy } from "@hookraft/use-copy"

export function Demo() {
const { textRef, iconRef, copied, trigger } = useCopy()

  return (
    <div className="flex items-center gap-2 px-4 py-3 font-mono text-sm w-full max-w-sm">
      <code
        ref={textRef as React.RefObject<HTMLElement | null>}
      >Where do I write my notes?</code>
      <button
        ref={iconRef}
        onClick={trigger}
        aria-label={copied ? "Copied!" : "Copy to clipboard"}
        className="shrink-0 rounded p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-green-500"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}