import { redirect } from "next/navigation";

export default function AdminLaundryStatusRedirect() {
  redirect("/admin/facilities-status");
}
