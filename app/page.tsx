import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HooksShowcase } from "@/components/showhooks";
import SiteHeader from "@/components/site-header";
import { PricingSection } from "@/components/sponsor";
import { getDocSchema } from "@/lib/doc";

const docSchema = await getDocSchema();

export default function Home() {
  return (
    <div className="flex flex-col relative min-h-dvh pt-14">
      <SiteHeader docSchema={docSchema} />
      <Hero />
      <HooksShowcase />
      <Suspense fallback={null}>
        <PricingSection />
      </Suspense>
      <Footer />
    </div>
  );
}