import { DocSchema } from "@/lib/types";

export const basicDoc: DocSchema = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Introduction",
        id: "introduction",
        description: "Logic hooks for your React views.",
      },
    ],
  },
  {
    title: "Lifecycle",
    items: [
      {
        title: "Doorway",
        id: "doorway",
        description: "Connect conditional rendering to side effects.",
      },
    ],
  },
  {
    title: "Async & Data",
    items: [
      {
        title: "UseRequest",
        id: "use-request",
        description: "Data fetching with global in-memory caching, request deduplication, and status tracking.",
      },
      {
        title: "UseQueue",
        id: "use-queue",
        description: "Manage and process async task queues in React.",
      },
      {
        title: "UsePipeline",
        id: "use-pipeline",
        description: "Orchestrate complex multi-step async flows with dependency management, parallel execution, rollback, and per-step retry.",
      },
    ],
  },
  {
    title: "Auth & Security",
    items: [
      {
        title: "UseAuth",
        id: "use-auth",
        description: "JWT auth with brute force protection and bot detection.",
      },
    ],
  },
  {
    title: "State",
    items: [
      {
        title: "UseHistory",
        id: "use-history",
        description: "Stop losing state changes. useHistory remembers every update so users can undo mistakes, redo actions, and navigate their full edit history.",
      },
      {
        title: "UseBroadcast",
        id: "use-broadcast",
        description: "Sync state across multiple browser tabs in real time. Built on the BroadcastChannel API — no server, no WebSockets required.",
      },
      {
        title: "UseForm",
        id: "use-form",
        description: "A simple, lightweight form management solution for React applications.",
      }
    ],
  },
];