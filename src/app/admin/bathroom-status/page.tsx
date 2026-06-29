import { redirect } from "next/navigation";

export default function AdminBathroomStatusRedirect() {
  redirect("/admin/facilities-status");
}
