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
    title: "Hooks",
    items: [
      {
        title: "Doorway",
        id: "doorway",
        description: "Connect conditional rendering to side effects.",
      },
      {
        title: "UseQueue",
        id: "use-queue",
        description: "Manage and process async task queues in React.",
      },
    ],
  }
];
