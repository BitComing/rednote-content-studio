import { Studio } from "@/components/workbench/studio";
import { getDifyStatus } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function Page() {
  const status = getDifyStatus();
  return (
    <Studio
      initialDifyConfigured={status.configured}
      initialAnalysisConfigured={Boolean(status.analysisConfigured)}
    />
  );
}
