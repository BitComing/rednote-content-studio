import { Studio } from "@/components/workbench/studio";
import { getDifyStatus } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Studio initialDifyConfigured={getDifyStatus().configured} />;
}
