"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatPrice } from "@/lib/format";

type AdminUser = {
  userId: string;
  name: string;
  phone: string;
  walletBalance: number;
  createdAt: string;
};

type AdminTransaction = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: "Deposit" | "Withdrawal";
  method: "K Pay" | "Wave Money";
  accountNumber: string;
  accountName: string;
  amount: number;
  receiptLast5?: string;
  receiptUploaded: boolean;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
};

type DashboardData = {
  users: AdminUser[];
  pending: AdminTransaction[];
  history: AdminTransaction[];
};

type DashboardTab = "users" | "pending" | "history";

async function readError(response: Response) {
  const result = await response.json() as { error?: string };
  return result.error ?? "The request failed.";
}

export default function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<DashboardTab>("pending");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin", { cache: "no-store" });
    if (response.status === 401) {
      setData(null);
      return;
    }
    if (!response.ok) throw new Error(await readError(response));
    setData(await response.json() as DashboardData);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load dashboard."))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: String(form.get("phone") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Admin sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function review(transactionId: string, decision: "Approved" | "Rejected", reviewNote: string) {
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/transactions/${encodeURIComponent(transactionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNote }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setNotice(`Request ${decision.toLowerCase()}.`);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to review transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error(await readError(response));
      setData(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign out.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-wrap py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="section-title mt-2">Admin Dashboard</h1>
        </div>
        {data && <button disabled={submitting} onClick={() => void logout()} className="button-secondary">Sign out</button>}
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-sage p-3 text-sm text-forest">{notice}</p>}
      {loading ? (
        <p className="text-sm text-muted">Loading dashboard…</p>
      ) : !data ? (
        <form onSubmit={handleLogin} className="max-w-md space-y-4 rounded-xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl">Admin sign in</h2>
          <label className="block text-sm">Phone number<input name="phone" required autoComplete="username" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
          <label className="block text-sm">Password<input name="password" required type="password" autoComplete="current-password" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
          <button disabled={submitting} className="button-primary w-full">{submitting ? "Signing in…" : "Sign in"}</button>
        </form>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {([
              ["pending", `Pending requests (${data.pending.length})`],
              ["users", `Users (${data.users.length})`],
              ["history", "Transaction history"],
            ] as const).map(([value, label]) => (
              <button key={value} onClick={() => setTab(value)} className={`rounded-full border px-4 py-2 text-sm ${tab === value ? "border-forest bg-sage text-forest" : "border-black/15 bg-white"}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === "users" ? (
            <section className="overflow-x-auto rounded-xl bg-white p-5 shadow-soft">
              <h2 className="mb-4 font-display text-2xl">Registered users</h2>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead><tr className="border-b border-black/10 text-xs text-muted"><th className="p-3">User ID</th><th className="p-3">Name</th><th className="p-3">Phone number</th><th className="p-3">Password</th><th className="p-3 text-right">Wallet balance</th></tr></thead>
                <tbody>
                  {data.users.map((user) => <tr key={user.userId} className="border-b border-black/5">
                    <td className="p-3">{user.userId}</td><td className="p-3">{user.name}</td><td className="p-3">{user.phone}</td><td className="p-3 text-muted">Not accessible</td><td className="p-3 text-right">{formatPrice(user.walletBalance)}</td>
                  </tr>)}
                  {data.users.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-muted">No users registered on this server yet.</td></tr>}
                </tbody>
              </table>
              <p className="mt-3 text-xs leading-5 text-muted">Passwords are never sent to or displayed in the admin dashboard. Existing demo accounts and profiles remain browser-local.</p>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className="font-display text-2xl">{tab === "pending" ? "Pending deposit and withdrawal requests" : "Approved and rejected transactions"}</h2>
              {(tab === "pending" ? data.pending : data.history).map((transaction) => (
                <article key={transaction.id} className="rounded-xl bg-white p-5 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-semibold">{transaction.type} · {transaction.method}</p><p className="mt-1 text-xs text-muted">{transaction.id} · {new Date(transaction.createdAt).toLocaleString()}</p></div>
                    <div className="text-right"><p className="font-semibold">{formatPrice(transaction.amount)}</p><p className={`mt-1 text-xs font-semibold ${transaction.status === "Approved" ? "text-forest" : transaction.status === "Rejected" ? "text-red-700" : "text-amber-700"}`}>{transaction.status}</p></div>
                  </div>
                  <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-muted">User</dt><dd>{transaction.userName} ({transaction.userId})</dd></div>
                    <div><dt className="text-xs text-muted">Phone number</dt><dd>{transaction.userPhone}</dd></div>
                    <div><dt className="text-xs text-muted">Account name</dt><dd>{transaction.accountName}</dd></div>
                    <div><dt className="text-xs text-muted">Account number</dt><dd>{transaction.accountNumber}</dd></div>
                    <div><dt className="text-xs text-muted">Receipt / last 5 digits</dt><dd>{transaction.receiptLast5 || (transaction.receiptUploaded ? <a className="text-forest underline" href={`/api/admin/transactions/${encodeURIComponent(transaction.id)}/receipt`} target="_blank" rel="noreferrer">View uploaded receipt</a> : "—")}</dd></div>
                    {transaction.reviewedAt && <div><dt className="text-xs text-muted">Reviewed</dt><dd>{new Date(transaction.reviewedAt).toLocaleString()}</dd></div>}
                    {transaction.reviewNote && <div className="sm:col-span-2"><dt className="text-xs text-muted">Review note</dt><dd>{transaction.reviewNote}</dd></div>}
                  </dl>
                  {tab === "pending" && <form onSubmit={(event) => event.preventDefault()} className="mt-4 flex flex-wrap items-end gap-2 border-t border-black/10 pt-4">
                    <label className="min-w-[220px] flex-1 text-xs text-muted">Review note (optional)<input name={`note-${transaction.id}`} maxLength={300} className="form-input mt-1 w-full rounded-lg border-black/15 text-sm" /></label>
                    <button type="button" disabled={submitting} onClick={(event) => {
                      const note = (event.currentTarget.form?.elements.namedItem(`note-${transaction.id}`) as HTMLInputElement | null)?.value ?? "";
                      void review(transaction.id, "Approved", note);
                    }} className="button-primary">{submitting ? "Saving…" : "Approve"}</button>
                    <button type="button" disabled={submitting} onClick={(event) => {
                      const note = (event.currentTarget.form?.elements.namedItem(`note-${transaction.id}`) as HTMLInputElement | null)?.value ?? "";
                      void review(transaction.id, "Rejected", note);
                    }} className="button-secondary">{submitting ? "Saving…" : "Reject"}</button>
                  </form>}
                </article>
              ))}
              {(tab === "pending" ? data.pending : data.history).length === 0 && <p className="rounded-xl bg-white p-5 text-sm text-muted">{tab === "pending" ? "No pending wallet requests." : "No reviewed transactions yet."}</p>}
            </section>
          )}
        </>
      )}
    </div>
  );
}
