import { Hero } from "@/components/hero";
import SiteHeader from "@/components/site-header";
import { getDocSchema } from "@/lib/doc";
const docSchema = await getDocSchema();

export default function Home() {
  return (
    <div className=" flex flex-col relative min-h-dvh pt-14 ">
      <SiteHeader docSchema={docSchema} />
      <Hero />
    </div>
  );
}
