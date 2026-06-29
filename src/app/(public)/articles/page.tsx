import { redirect } from "next/navigation";

/** Articles now live in the unified feed. */
export default function ArticlesPage() {
  redirect("/feed");
}
