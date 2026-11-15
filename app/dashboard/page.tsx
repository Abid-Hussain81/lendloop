import { Dashboard } from "@/components/dashboard";
import { SetupNotice } from "@/components/setup-notice";
import { isConfigured } from "@/lib/config";
export default function DashboardPage() {
  return isConfigured() ? <Dashboard /> : <SetupNotice />;
}
