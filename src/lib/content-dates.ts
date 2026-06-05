import { format } from "date-fns";

/** Posted + edited lines for cards and headers. */
export function formatPostedEditedLines(
  createdAt: string,
  updatedAt?: string | null,
): string[] {
  const posted = new Date(createdAt);
  const edited = updatedAt ? new Date(updatedAt) : posted;
  const lines = [`Posted ${format(posted, "MMM d, yyyy")}`];
  if (edited.getTime() - posted.getTime() > 60_000) {
    lines.push(`Edited ${format(edited, "MMM d, yyyy")}`);
  }
  return lines;
}
