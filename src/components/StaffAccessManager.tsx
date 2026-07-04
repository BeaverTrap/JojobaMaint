"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AuthorizedEmail } from "@/lib/database.types";
import {
  STAFF_ROLE_LABELS,
  assignableStaffRoles,
  type StaffRole,
} from "@/lib/staff-roles";

export default function StaffAccessManager({
  initialRows,
  actorRole,
}: {
  initialRows: AuthorizedEmail[];
  actorRole: StaffRole;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("staff");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignableRoles = useMemo(
    () => assignableStaffRoles(actorRole),
    [actorRole],
  );

  async function refreshRows() {
    const response = await fetch("/api/admin/staff-access");
    const data = (await response.json()) as {
      rows?: AuthorizedEmail[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? "Could not refresh list");
    }
    setRows(data.rows ?? []);
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/staff-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, staff_role: role, note }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not add email");

      setEmail("");
      setNote("");
      setRole("staff");
      await refreshRows();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add email");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(row: AuthorizedEmail, nextRole: StaffRole) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/staff-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: row.email, staff_role: nextRole }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not update role");

      await refreshRows();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(row: AuthorizedEmail) {
    if (
      !window.confirm(
        `Remove ${row.email} from the whitelist? They will lose staff access on next sign-in.`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/staff-access?email=${encodeURIComponent(row.email)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not remove email");

      await refreshRows();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove email");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-ink">Add or update access</h2>
        <p className="text-xs leading-relaxed text-muted">
          Use the Google sign-in email exactly. Role changes apply the next time
          that person signs in.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-ink">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@gmail.com"
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink">Role</span>
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as StaffRole)
              }
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink"
            >
              {assignableRoles.map((option) => (
                <option key={option} value={option}>
                  {STAFF_ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink">Note (optional)</span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Grounds crew, office manager…"
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save access"}
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Whitelisted emails</h2>
          <p className="mt-1 text-xs text-muted">
            {rows.length} email{rows.length === 1 ? "" : "s"} on the list.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-hover/30 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Role</th>
                <th className="px-4 py-2 font-semibold">Note</th>
                <th className="px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted"
                  >
                    No whitelisted emails yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.email}
                    className="border-b border-line/70 align-top last:border-0"
                  >
                    <td className="px-4 py-3 text-xs text-ink">{row.email}</td>
                    <td className="px-4 py-3 text-xs">
                      <select
                        value={row.staff_role}
                        disabled={submitting}
                        onChange={(event) =>
                          handleRoleChange(
                            row,
                            event.target.value as StaffRole,
                          )
                        }
                        className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink"
                      >
                        {assignableRoles.includes(row.staff_role) ? (
                          assignableRoles.map((option) => (
                            <option key={option} value={option}>
                              {STAFF_ROLE_LABELS[option]}
                            </option>
                          ))
                        ) : (
                          <option value={row.staff_role}>
                            {STAFF_ROLE_LABELS[row.staff_role]}
                          </option>
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {row.note ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <button
                        type="button"
                        disabled={
                          submitting ||
                          !assignableRoles.includes(row.staff_role)
                        }
                        onClick={() => handleRemove(row)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-hover/20 p-4 text-xs leading-relaxed text-muted">
        <h3 className="text-sm font-semibold text-ink">Role guide</h3>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            <strong className="text-ink">Staff</strong> — post landscaping and
            maintenance updates.
          </li>
          <li>
            <strong className="text-ink">Manager</strong> — park alerts,
            articles, assessments, facilities status, map editing.
          </li>
          <li>
            <strong className="text-ink">Admin</strong> — emergency SMS, staff
            access, and all manager tools.
          </li>
          <li>
            <strong className="text-ink">Webmaster</strong> — everything above,
            plus site-builder tools like the weather mascot layout.
          </li>
        </ul>
        {actorRole === "admin" ? (
          <p className="mt-2">
            As an admin you can assign staff, manager, or admin. Only a
            webmaster can grant webmaster access.
          </p>
        ) : null}
      </section>
    </div>
  );
}
