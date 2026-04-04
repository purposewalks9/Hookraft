"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShimmerText } from "@/components/spell-ui/shimmer-text";
import { useRouter } from "next/navigation";
import { GoogleIcon } from "@/components/auth/google-icon";
import { SiGithub } from "@icons-pack/react-simple-icons";
import {  Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user && !isPending) router.push("/");
  }, [session, isPending, router]);

  async function handleSignIn(provider: "google" | "github") {
    setIsSigningIn(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch {
      setIsSigningIn(null);
    }
  }

  if (isPending) return null;
  if (session?.user) return null;

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>


        <ShimmerText className="text-sm text-muted-foreground tracking-tight">
          Sign in to your Hookraft account
        </ShimmerText>

      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => handleSignIn("google")}
          disabled={isSigningIn !== null}
          className="w-full gap-2 cursor-pointer transition-transform duration-150 ease-out will-change-transform active:scale-[0.97]"
        >
          {isSigningIn === "google" ? (
            <Loader2 className="size-4 animate-spin shrink-0" />
          ) : (
            <GoogleIcon />
          )}
          <span>{isSigningIn === "google" ? "Redirecting..." : "Continue with Google"}</span>
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={() => handleSignIn("github")}
          disabled={isSigningIn !== null}
          className="w-full gap-2 cursor-pointer transition-transform duration-150 ease-out will-change-transform active:scale-[0.97]"
        >
          {isSigningIn === "github" ? (
            <Loader2 className="size-4 animate-spin shrink-0" />
          ) : (
            <SiGithub className="size-4 shrink-0" />
          )}
          <span>{isSigningIn === "github" ? "Redirecting..." : "Continue with GitHub"}</span>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span>Don&apos;t have an account?</span>
        <Link
          href="/signup"
          className="inline-flex items-center gap-x-0.5 text-sm font-medium text-primary hover:text-primary/85 transition-colors [&_svg]:size-3.5 [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:translate-x-0.5"
        >
          <span>Sign up</span>
        </Link>
      </p>
    </>
  );
}