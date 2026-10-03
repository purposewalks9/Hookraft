"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ComponentType,
  type RefObject,
  type SVGProps,
} from "react";
import {
  Triangle,
  Copy,
  Check,
  MoreVertical,
  Github,
  LineChart,
  ArrowUpDown,
  Settings,
  Globe,
  Star,
} from "lucide-react";


type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type MenuItem = {
  id: string;
  label: string;
  hint: string;
  icon: IconComponent;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "performance", label: "Performance", hint: "View build & runtime metrics", icon: LineChart },
  { id: "redeploy", label: "Redeploy", hint: "Run this build again", icon: ArrowUpDown },
  { id: "settings", label: "Settings", hint: "Configure project settings", icon: Settings },
  { id: "domains", label: "Domains", hint: "Manage attached domains", icon: Globe },
  { id: "favorite", label: "Favorite", hint: "Pin to your dashboard", icon: Star },
];

interface IconMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
}

function IconMenu({ open, onClose, anchorRef }: IconMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const groupWarmRef = useRef(false);
  const warmTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Close on outside click / Escape, return focus to trigger.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !anchorRef.current?.contains(target)
      ) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      const items = MENU_ITEMS;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        anchorRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveIndex(items.length - 1);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, anchorRef]);

  // Focus the active item whenever the menu opens or selection moves.
  useEffect(() => {
    if (!open) return;
    const node = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      "[data-menu-item]"
    )[activeIndex];
    node?.focus();
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) {
      groupWarmRef.current = false;
      setHoveredId(null);
    }
    return () => clearTimeout(warmTimeoutRef.current);
  }, [open]);

  const showTooltip = useCallback((id: string) => {
    if (groupWarmRef.current) {
      setHoveredId(id);
      return;
    }
    warmTimeoutRef.current = setTimeout(() => {
      groupWarmRef.current = true;
      setHoveredId(id);
    }, 350);
  }, []);

  const hideTooltip = useCallback(() => {
    clearTimeout(warmTimeoutRef.current);
    setHoveredId(null);
  }, []);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      aria-label="Project actions"
      className="absolute right-0 top-12 z-20 flex flex-col gap-1 rounded-full border border-white/10 bg-neutral-900/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-sm animate-menu-in motion-reduce:animate-none"
    >
      {MENU_ITEMS.map(({ id, label, hint, icon: Icon }, index) => (
        <div key={id} className="relative">
          <button
            type="button"
            data-menu-item
            role="menuitem"
            tabIndex={activeIndex === index ? 0 : -1}
            aria-label={label}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => {
              setActiveIndex(index);
              showTooltip(id);
            }}
            onMouseLeave={hideTooltip}
            onClick={() => onClose()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-90"
          >
            <Icon className="h-4 w-4 transition-transform duration-150" strokeWidth={1.75} />
          </button>

          <span
            role="tooltip"
            className={[
              "pointer-events-none absolute right-11 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-100 shadow-lg transition-all duration-150",
              hoveredId === id ? "translate-x-0 opacity-100" : "translate-x-1 opacity-0",
            ].join(" ")}
          >
            {label}
            <span className="ml-1.5 text-neutral-400">{hint}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

type DeploymentStatus = "success" | "building" | "error";

export interface DeploymentCardProps {
  name?: string;
  domain?: string;
  message?: string;
  status?: DeploymentStatus;
  date?: string;
  sourceIcon?: IconComponent;
}

const STATUS_STYLES: Record<
  DeploymentStatus,
  { dot: string; ring: string; text: string }
> = {
  success: { dot: "bg-emerald-500", ring: "bg-emerald-500/30", text: "Ready" },
  building: { dot: "bg-amber-500", ring: "bg-amber-500/30", text: "Building…" },
  error: { dot: "bg-red-500", ring: "bg-red-500/30", text: "Failed" },
};

export function DeploymentCard({
  name = "raven",
  domain = "raven.dev",
  message = "Added source map support",
  status = "success",
  date = "Aug 3",
  sourceIcon: SourceIcon = Github,
}: DeploymentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(copiedTimeoutRef.current), []);

  const statusStyles = STATUS_STYLES[status];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(domain);
    } catch {
      // Clipboard API unavailable — fail silently, no broken UI.
    }
    setCopied(true);
    clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_20px_40px_-24px_rgba(0,0,0,0.8)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
            <Triangle className="h-4 w-4 fill-black text-black" strokeWidth={0} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-tight text-white">
              {name}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <a
                href={`https://${domain}`}
                className="truncate text-sm text-neutral-400 underline decoration-neutral-700 underline-offset-2 transition-colors duration-150 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 rounded-sm"
              >
                {domain}
              </a>
              <button
                type="button"
                aria-label={copied ? "Copied domain" : "Copy domain"}
                onClick={handleCopy}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-white/10 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-90"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
                ) : (
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Project actions"
            onClick={() => setMenuOpen((v) => !v)}
            className={[
              "grid h-9 w-9 place-items-center rounded-full text-neutral-400 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-90",
              menuOpen ? "bg-white/10 text-white" : "",
            ].join(" ")}
          >
            <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <IconMenu open={menuOpen} onClose={() => setMenuOpen(false)} anchorRef={triggerRef} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={[
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none",
              statusStyles.ring,
            ].join(" ")}
          />
          <span className={["relative inline-flex h-2 w-2 rounded-full", statusStyles.dot].join(" ")} />
        </span>
        <span className="text-neutral-300">{message}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-neutral-300">
          <SourceIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-400">{statusStyles.text}</span>
          <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium tabular-nums text-neutral-300">
            {date}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes menu-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-menu-in {
          transform-origin: top right;
          animation: menu-in 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center bg-black p-8">
      <DeploymentCard />
    </div>
  );
}