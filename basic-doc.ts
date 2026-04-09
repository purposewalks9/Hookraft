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
    title: "Control Flow & Lifecycle",
    items: [
      {
        title: "Doorway",
        id: "doorway",
        description: "Connect conditional rendering to side effects.",
      },
      {
        title: "UsePipeline",
        id: "use-pipeline",
        description: "Orchestrate complex multi-step async flows with dependency management, parallel execution, rollback, and per-step retry.",
      },
      {
        title: "UseKeyCursor",
        id: "use-key-cursor",
        description: "Declarative key cursor with dynamic positioning and auto-cleanup.",
      },
    ],
  },

  {
    title: "Data Fetching & Async",
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
    ],
  },

  {
    title: "Real-time & Communication",
    items: [
      {
        title: "UseWebSocket",
        id: "use-websocket",
        description: "A complete WebSocket hook with auto-reconnect, exponential backoff, message queuing, heartbeat, and full lifecycle callbacks.",
      },
      {
        title: "UseBroadcast",
        id: "use-broadcast",
        description: "Sync state across multiple browser tabs in real time using BroadcastChannel.",
      },
      {
        title: "UseEngagement",
        id: "use-engagement",
        description: "Track user engagement metrics like active time, idle time, and total clicks with automatic offline support and data syncing.",
      }
    ],
  },

  {
    title: "State Management",
    items: [
      {
        title: "UseHistory",
        id: "use-history",
        description: "Track state changes with undo/redo and full history navigation.",
      },
      {
        title: "UseForm",
        id: "use-form",
        description: "Lightweight form state and validation management for React.",
      },
      {
        title: "UseCopy",
        id: "use-copy",
        description: "Copy text to the clipboard with visual feedback.",
      }
    ],
  },

  {
    title: "Authentication & Security",
    items: [
      {
        title: "UseAuth",
        id: "use-auth",
        description: "JWT auth with brute force protection and bot detection.",
      },
    ],
  },
];