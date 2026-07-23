import { format } from "date-fns";

/** Posted date line for cards and headers. */
export function formatPostedEditedLines(
  createdAt: string,
  _updatedAt?: string | null,
): string[] {
  const posted = new Date(createdAt);
  return [`Posted ${format(posted, "MMM d, yyyy")}`];
}
