import { Studio } from "@/components/workbench/studio";
import { getDifyStatus } from "@/lib/config";

export default function Page() {
  return <Studio initialDifyConfigured={getDifyStatus().configured} />;
}
