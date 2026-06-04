import { redirect } from "next/navigation";

export default function NewMaintenanceAssessmentPage() {
  redirect("/admin?area=maintenance&format=structured");
}
