"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Mail,
  User,
  Award,
  Crown,
  Gem,
  Sparkles,
  Globe,
  LayoutGrid,
  MessageCircle,
  MessageSquare,
  ImageIcon,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
import { Footer } from "@/components/footer";
import ShimmerText from "@/components/spell-ui/shimmer-text";

const PLAN_META = {
  silver: { label: "Silver", icon: Award, text: "text-slate-500" },
  gold: { label: "Gold", icon: Crown, text: "text-yellow-500" },
  diamond: { label: "Diamond", icon: Gem, text: "text-cyan-400" },
};

const HOOKRAFT_EMAIL = "boypee71@gmail.com";

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    if (!session?.user && !isPending) router.push("/signin");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/sponsorship")
        .then((r) => r.json())
        .then((data) => {
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

  if (isPending || !session?.user) return null;

  const { name, email, image } = session.user;
  const planMeta = plan ? PLAN_META[plan as keyof typeof PLAN_META] : null;
  const accountId = "HK-" + (session.user.id ?? "").slice(0, 6).toUpperCase();

  const instructions = [
    { icon: LayoutGrid, label: "Account ID", hint: sponsorId ?? accountId, mono: true },
    { icon: MessageCircle, label: "Discord username"},
    { icon: Globe, label: "Website URL" },
    { icon: ImageIcon, label: "Brand logo" },
    { icon: MessageSquare, label: "Additional info"},
  ];

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
            <div className="border-x overflow-hidden">
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
              </div>
            </div>

            {/* Sponsorship card */}
            <div className="border-x overflow-hidden">
              <div className="p-6 space-y-5">
                {planLoading ? (
                  <div className="h-14 bg-muted/40 rounded-lg animate-pulse" />
                ) : planMeta ? (
                  <>
                    <div className="flex items-center p-4">
                      <span className="w-9 h-9 flex items-center justify-center shrink-0">
                        <planMeta.icon className={`w-4 h-4 ${planMeta.text}`} />
                      </span>
                      <div>
                        <ShimmerText className={`text-sm font-semibold ${planMeta.text}`}>
                          {planMeta.label} Sponsor
                        </ShimmerText>
                      </div>
                    </div>

                    <div className="rounded-lg p-5 space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Send the following to get your brand featured:
                      </p>

                      <div className="space-y-2 mb-4">
                        {instructions.map(({ icon: Icon, label, hint, mono }) => (
                          <div
                            key={label}
                            className="flex items-center gap-3 px-4 py-2.5  border border-border/50 text-sm"
                          >
                            <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">{label}</span>
                            <span
                              className={`ml-auto text-xs ${mono
                                  ? "font-mono bg-background border border-border/60 px-1.5 py-0.5 rounded"
                                  : "text-muted-foreground/60"
                                }`}
                            >
                              {hint}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 px-4 py-2.5 border border-border text-sm">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Send to</span>

                        <a href={`mailto:${HOOKRAFT_EMAIL}`}
                          className="ml-auto font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
                        >
                          {HOOKRAFT_EMAIL}
                        </a>
                      </div>
                    </div>  {/* ← closes the rounded-lg p-5 div */}
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

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}