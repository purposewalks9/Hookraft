"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { User } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { Footer } from "@/components/footer";

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user && !isPending) router.push("/signin");
  }, [session, isPending, router]);

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/signin") },
    });
  }

  if (isPending || !session?.user) return null;

  const { name, email, image } = session.user;
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

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}