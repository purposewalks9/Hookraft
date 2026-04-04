"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Mail,
  User,
  Shield,
  Award,
  Crown,
  Gem,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
import { Footer } from "@/components/footer";

const PLAN_META = {
  silver: {
    label: "Silver",
    icon: Award,
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-500",
  },
  gold: {
    label: "Gold",
    icon: Crown,
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-500",
  },
  diamond: {
    label: "Diamond",
    icon: Gem,
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    text: "text-cyan-400",
  },
};

const HOOKRAFT_EMAIL = "sponsor@hookraft.site";

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.user && !isPending) router.push("/signin");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/sponsorship")
        .then((r) => r.json())
        .then((data) => {
          // ✅ Only show the plan if payment was actually verified by webhook
          if (data.verified === true) {
            setPlan(data.plan);
            setSponsorId(data.sponsorId);
          } else {
            setPlan(null);
            setSponsorId(null);
          }
          setPlanLoading(false);
        })
        .catch(() => setPlanLoading(false));
    }
  }, [session]);

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/signin") },
    });
  }

  function copyId() {
    if (!sponsorId) return;
    navigator.clipboard.writeText(sponsorId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isPending || !session?.user) return null;

  const { name, email, image } = session.user;
  const planMeta = plan ? PLAN_META[plan as keyof typeof PLAN_META] : null;

  const accountId = "HK-" + (session.user.id ?? "").slice(0, 6).toUpperCase();

  return (
    <div className="flex flex-col relative min-h-dvh bg-background">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="max-w-3xl mx-auto px-4 py-16">

          <div className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
          </div>

          <div className="space-y-6">

            {/* Profile card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-sm font-medium">Profile</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your account information</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-5">
                  {image ? (
                    <Image
                      src={image}
                      alt={name ?? "Avatar"}
                      width={80}
                      height={80}
                      className="rounded-full object-cover ring-2 ring-border shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center ring-2 ring-border shrink-0">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-xl font-semibold tracking-tight">{name ?? "—"}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{email ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 bg-muted px-2 py-0.5 rounded-md inline-block">
                      OAuth account
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="grid gap-3">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
                    <span className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Full Name</p>
                      <p className="text-sm font-medium truncate">{name ?? "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
                    <span className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Email Address</p>
                      <p className="text-sm font-medium truncate">{email ?? "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
                    <span className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Account ID</p>
                      <p className="text-sm font-mono font-medium">{sponsorId ?? accountId}</p>
                    </div>
                    <button
                      onClick={copyId}
                      className="shrink-0 w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                      title="Copy ID"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sponsorship card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-sm font-medium">Sponsorship</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your Hookraft sponsor tier</p>
              </div>

              <div className="p-6 space-y-5">
                {planLoading ? (
                  <div className="h-14 bg-muted/40 rounded-lg animate-pulse" />
                ) : planMeta ? (
                  <>
                    <div className={`flex items-center gap-4 p-4 rounded-lg border ${planMeta.bg} ${planMeta.border}`}>
                      <span className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                        <planMeta.icon className={`w-4 h-4 ${planMeta.text}`} />
                      </span>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Active Tier</p>
                        <p className={`text-sm font-semibold ${planMeta.text}`}>{planMeta.label} Sponsor</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-3">
                      <p className="text-sm font-medium">🎉 Thank you for sponsoring Hookraft!</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        To get your brand featured, please send us an email with the following information:
                      </p>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li>• Your <span className="text-foreground font-medium">Account ID</span>: <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{sponsorId ?? accountId}</span></li>
                        <li>• Your <span className="text-foreground font-medium">Discord username</span></li>
                        <li>• Your <span className="text-foreground font-medium">website URL</span></li>
                        <li>• Your <span className="text-foreground font-medium">brand logo</span> (PNG or SVG)</li>
                        <li>• Any <span className="text-foreground font-medium">additional info</span> you'd like displayed</li>
                      </ul>
                      <p className="text-sm text-muted-foreground pt-1">
                        Send everything to:{" "}
                        <a
                          href={`mailto:${HOOKRAFT_EMAIL}`}
                          className="font-bold text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity"
                        >
                          {HOOKRAFT_EMAIL}
                        </a>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                      </span>
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Current Tier</p>
                        <p className="text-sm font-medium">Free</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/sponsor")}
                      className="shrink-0 cursor-pointer"
                    >
                      Become a Sponsor
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Security card */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-sm font-medium">Security</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your session</p>
              </div>
              /</div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}