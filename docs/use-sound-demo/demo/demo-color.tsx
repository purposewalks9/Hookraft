import { MorphDownloadButton } from "../../../packages/morph/morph-download-button";

export function Demo() {
  return (
    <div className="flex items-center gap-6">
      <MorphDownloadButton color="blue" />
      <MorphDownloadButton color="purple" />
      <MorphDownloadButton color="emerald" />
      <MorphDownloadButton color="rose" />
    </div>
  );
}
