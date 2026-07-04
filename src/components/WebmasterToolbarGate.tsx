import { getCurrentUser } from "@/lib/auth";
import WebmasterToolbar from "@/components/WebmasterToolbar";

export default async function WebmasterToolbarGate() {
  const { isWebmaster, staffRole, debugRole } = await getCurrentUser();

  if (!isWebmaster || !staffRole) return null;

  return <WebmasterToolbar realRole={staffRole} debugRole={debugRole} />;
}
