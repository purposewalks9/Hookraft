"use client";

import { useState, useEffect, useRef } from "react";
import {
  Gem, Crown, Award, Lock, ExternalLink,
  CheckCircle, Loader2, XCircle,
} from "lucide-react";
import { HighlightedText } from "./spell-ui/highlighted-text";
import { RichButton } from "./spell-ui/rich-button";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

// How long to poll waiting for the webhook (ms)
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 4000;          // every 4 seconds

const FLUTTERWAVE_BASE_LINKS: Record<string, string> = {
  silver: "https://flutterwave.com/pay/puhpuyfpqo1x",
  gold: "https://flutterwave.com/pay/your-gold-link",
  diamond: "https://flutterwave.com/pay/your-diamond-link",
};

const plans = [
  {
    id: "silver",
    name: "Silver",
    icon: Award,
    price: "₦10,000",
    features: [
      "Support Hookraft",
      "Custom Role on Discord server",
      "Small logo & link in Sponsor page",
    ],
    accent: "#94a3b8",
  },
  {
    id: "gold",
    name: "Gold",
    icon: Crown,
    price: "₦50,000",
    badge: "Best Value",
    features: [
      "All Silver features",
      "Medium logo & link in Sponsor page",
      "Link in footer",
    ],
    accent: "#fbbf24",
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: Gem,
    price: "₦100,000",
    features: [
      "All Platinum features",
      "Early access to upcoming components",
      "Featured logo with Homepage feature card",
    ],
    accent: "#67e8f9",
  },
] as const;

function PlanCard({
  plan,
  isLoggedIn,
}: {
  plan: (typeof plans)[number];
  isLoggedIn: boolean;
}) {
  const Icon = plan.icon;
  const router = useRouter();

  type Step = "idle" | "paying" | "polling" | "done" | "timeout";
  const [step, setStep] = useState<Step>("idle");
  const [txRef, setTxRef] = useState<string>("");

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
  }

  async function handleOpenPayment() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // 1. Generate a unique tx_ref for this payment attempt
    const ref = `HK-${plan.id}-${nanoid(10)}`;
    setTxRef(ref);

    // 2. Save an unverified row to the DB so webhook can match it later
    await fetch("/api/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan.id, txRef: ref }),
    });

    // 3. Open Flutterwave with tx_ref appended so it comes back in the webhook
    const link = `${FLUTTERWAVE_BASE_LINKS[plan.id]}?tx_ref=${ref}`;
    window.open(link, "_blank");
    setStep("paying");
  }

  function startPolling() {
    setStep("polling");

    // Poll every 4 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/sponsorship");
        const data = await res.json();
        if (data.verified === true && data.plan === plan.id) {
          stopPolling();
          setStep("done");
        }
      } catch {
        // network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);

    // Stop polling after 5 minutes and show timeout message
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setStep("timeout");
    }, POLL_TIMEOUT_MS);
  }

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex-1 border-r p-6 flex flex-col transition-colors">

        {"badge" in plan && plan.badge && (
          <span className="absolute top-4 right-4 text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
            {plan.badge}
          </span>
        )}

        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-5">
          <Icon size={24} color={plan.accent} strokeWidth={2.5} />
        </div>

        <h3 className="text-2xl font-medium text-foreground text-left mb-4">{plan.name}</h3>

        <div className="mb-1 text-left">
          <span className="text-4xl font-semibold tracking-tighter text-foreground">
            {plan.price}
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-left mb-6">One-time payment</p>

        <ul className="space-y-2.5 mb-8 text-left text-sm text-muted-foreground flex-1">
          {plan.features.map((feature, i) => (
            <li key={i} className="text-[13px] leading-snug">{feature}</li>
          ))}
        </ul>

        {/* Not logged in */}
        {!isLoggedIn && (
          <RichButton className="w-full gap-2 cursor-pointer" onClick={() => router.push("/login")}>
            <Lock className="size-3.5" />
            Sign in to sponsor
          </RichButton>
        )}

        {/* Idle — open payment */}
        {isLoggedIn && step === "idle" && (
          <RichButton className="w-full gap-2 cursor-pointer" onClick={handleOpenPayment}>
            <ExternalLink className="size-3.5" />
            Sponsor — {plan.name}
          </RichButton>
        )}

        {/* Paying — waiting for user to complete payment */}
        {isLoggedIn && step === "paying" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Complete your payment in the opened tab, then click below
            </p>
            <Button className="w-full gap-2 cursor-pointer" onClick={startPolling}>
              <CheckCircle className="size-4" />
              I've completed payment
            </Button>
            <button
              onClick={() => setStep("idle")}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Polling — waiting for webhook to confirm */}
        {isLoggedIn && step === "polling" && (
          <div className="flex flex-col items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center">
              Verifying your payment... this usually takes a few seconds.
            </p>
          </div>
        )}

        {/* Done — webhook confirmed */}
        {step === "done" && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium">
            <CheckCircle className="size-4" />
            Payment verified! Check your settings.
          </div>
        )}

        {/* Timeout — webhook never fired in time */}
        {step === "timeout" && (
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs">
              <XCircle className="size-4 shrink-0 mt-0.5" />
              <span>
                We couldn't verify your payment yet. If you paid, it may take a few minutes to reflect.{" "}
                <button
                  className="underline underline-offset-2 hover:opacity-80 cursor-pointer"
                  onClick={startPolling}
                >
                  Check again
                </button>
              </span>
            </div>
            <button
              onClick={() => setStep("idle")}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PricingSection() {
  const { data: session } = authClient.useSession();

  return (
    <section className="relative py-20 px-4 w-full mx-auto text-center overflow-hidden max-w-[1400px]">
      <div className="max-w-3xl mx-auto mb-14">
        <h2 className="text-xl md:text-3xl font-medium tracking-tight leading-snug md:leading-[1.15] text-foreground">
          <span className="sm:hidden">
            Sponsor Hookraft,{" "}
            <HighlightedText from="left" delay={0.1} className="px-2 py-1 rounded-md text-white">
              get exclusive Hooks
            </HighlightedText>
          </span>
          <span className="hidden sm:inline">
            Sponsor Hookraft,{" "}
            <HighlightedText from="left" delay={0.1} className="px-2 py-1 rounded-md text-white">
              get exclusive Hooks
            </HighlightedText>{" "}
            and help us keep it free for everyone
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isLoggedIn={!!session?.user}
          />
        ))}
      </div>
    </section>
  );
}