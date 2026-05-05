"use client";

import {
  FaGithub,
  FaXTwitter,
  FaLinkedin,
  FaNpm,
  FaDiscord,
} from "react-icons/fa6";

import { DevDock } from "../../../packages/DevDock/src";

// ── PLATFORM → ICON MAP ───────────────────────────────

const ICONS: Record<string, React.ReactNode> = {
  github: <FaGithub />,
  x: <FaXTwitter />,
  linkedin: <FaLinkedin />,
  npm: <FaNpm />,
  discord: <FaDiscord />,
};

export function DemoVertical() {
  const links = [
    { platform: "github", href: "https://github.com" },
    { platform: "x", href: "https://x.com" },
    { platform: "linkedin", href: "https://linkedin.com" },
    { platform: "npm", href: "https://npmjs.com" },
    { platform: "discord", href: "https://discord.com" },
  ];

  // Convert → DevDock format
  const apps = links.map((l) => ({
    name: l.platform,
    href: l.href,
    icon: ICONS[l.platform],
  }));

  return (

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <DevDock apps={apps} size="sm" addable={false} />
      </div>
  );
}