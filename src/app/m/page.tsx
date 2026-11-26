import { MobileStudio } from "@/components/mobile/mobile-studio";
import { getDifyStatus } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function MobilePage() {
  const status = getDifyStatus();
  return (
    <MobileStudio
      initialDifyConfigured={status.configured}
      initialAnalysisConfigured={Boolean(status.analysisConfigured)}
    />
  );
}
