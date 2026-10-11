"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatPrice } from "@/lib/format";

type ServiceAccount = {
  storeId: string;
  phone: string;
  storeName: string;
  storeAddress: string;
  invitationCode: string;
  referralCode: string;
  registrationIp: string;
  walletBalanceMMK: number;
  signupBonusMMK: number;
  referralBonusMMK: number;
  bonusUnlocked: boolean;
  successfulSales: number;
  createdAt: string;
  passwordStatus: string;
};
type ServiceOrder = { id: string; buyerStoreId: string; paymentMethod: "K Pay" | "Wave Pay"; items: { name: string; quantity: number; sellerStoreId?: string }[]; totalMMK: number; address: string; status: "Processing" | "Delivered"; createdAt: string };
type ServiceTicket = { id: string; storeId: string; message: string; status: "Open" | "Resolved"; createdAt: string; resolution?: string };
type WalletEntry = { id: string; storeId: string; action: string; amountMMK: number; note: string; createdAt: string };
type Dashboard = { accounts: ServiceAccount[]; orders: ServiceOrder[]; tickets: ServiceTicket[]; walletEntries: WalletEntry[] };
type Tab = "accounts" | "orders" | "support" | "wallet";

async function readResult(response: Response) {
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request failed.");
  return result;
}

export default function CustomerServiceOffice() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<Tab>("accounts");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/customer-service/operations", { cache: "no-store" });
    if (response.status === 401) {
      setData(null);
      return;
    }
    const result = await readResult(response) as Dashboard;
    setData(result);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load service dashboard."))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const values = new FormData(event.currentTarget);
      const response = await fetch("/api/customer-service/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: values.get("phone"), password: values.get("password") }),
      });
      await readResult(response);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function act(body: Record<string, string | number>) {
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await readResult(await fetch("/api/customer-service/operations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }));
      setNotice("Customer-service action completed.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The action failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function walletAction(event: FormEvent<HTMLFormElement>, storeId: string, action: "deposit" | "withdraw") {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    await act({
      action,
      storeId,
      amountMMK: Number(values.get("amountMMK")),
      note: String(values.get("note") ?? ""),
    });
    form.reset();
  }

  async function signOut() {
    setSubmitting(true);
    try {
      await readResult(await fetch("/api/customer-service/logout", { method: "POST" }));
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
        <div><p className="eyebrow">Restricted operations</p><h1 className="section-title mt-2">Customer Service</h1><p className="mt-2 text-sm text-muted">Private staff portal · never share staff credentials.</p></div>
        {data && <button disabled={submitting} onClick={() => void signOut()} className="button-secondary">Sign out</button>}
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-sage p-3 text-sm text-forest">{notice}</p>}
      {loading ? <p className="text-sm text-muted">Loading…</p> : !data ? (
        <form onSubmit={(event) => void login(event)} className="max-w-md space-y-4 rounded-xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl">Staff sign in</h2>
          <label className="block text-sm">Staff phone<input name="phone" required autoComplete="username" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
          <label className="block text-sm">Password<input name="password" required type="password" autoComplete="current-password" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
          <button disabled={submitting} className="button-primary w-full">{submitting ? "Signing in…" : "Sign in"}</button>
        </form>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {([
              ["accounts", `Stores (${data.accounts.length})`],
              ["orders", `Orders (${data.orders.length})`],
              ["support", `Support tickets (${data.tickets.filter((ticket) => ticket.status === "Open").length} open)`],
              ["wallet", `Wallet ledger (${data.walletEntries.length})`],
            ] as const).map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`rounded-full border px-4 py-2 text-sm ${tab === value ? "border-forest bg-sage text-forest" : "border-black/15 bg-white"}`}>{label}</button>)}
          </div>
          {tab === "accounts" && <section className="space-y-4">
            {data.accounts.map((account) => <article key={account.storeId} className="rounded-xl bg-white p-5 shadow-soft">
              <div className="grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <p><span className="text-muted">Store ID</span><br /><strong>{account.storeId}</strong></p>
                <p><span className="text-muted">Store name</span><br /><strong>{account.storeName}</strong></p>
                <p><span className="text-muted">Phone</span><br /><strong>{account.phone}</strong></p>
                <p><span className="text-muted">Invitation code used</span><br /><strong>{account.invitationCode || "—"}</strong></p>
                <p><span className="text-muted">Store referral code</span><br /><strong>{account.referralCode}</strong></p>
                <p><span className="text-muted">Registration IP</span><br /><strong>{account.registrationIp}</strong></p>
                <p><span className="text-muted">Store address</span><br /><strong>{account.storeAddress}</strong></p>
                <p><span className="text-muted">Wallet balance</span><br /><strong>{formatPrice(account.walletBalanceMMK)}</strong></p>
                <p><span className="text-muted">Signup / referral bonus</span><br /><strong>{account.signupBonusMMK + account.referralBonusMMK ? `${formatPrice(account.signupBonusMMK + account.referralBonusMMK)} · ${account.bonusUnlocked ? "Unlocked" : "Locked"}` : "None"}</strong></p>
                <p><span className="text-muted">Successful sales / password storage</span><br /><strong>{account.successfulSales} · {account.passwordStatus}</strong></p>
              </div>
              <div className="mt-4 grid gap-3 border-t border-black/10 pt-4 md:grid-cols-2">
                {(["deposit", "withdraw"] as const).map((action) => <form key={action} onSubmit={(event) => void walletAction(event, account.storeId, action)} className="grid gap-2 rounded-lg bg-sage/50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input name="amountMMK" type="number" min="1" step="1" required placeholder="Amount in MMK" aria-label={`${action} amount in MMK`} className="form-input min-w-0 rounded-lg border-black/15 text-sm" />
                  <input name="note" maxLength={300} placeholder="Verified payment / note" aria-label={`${action} note`} className="form-input min-w-0 rounded-lg border-black/15 text-sm" />
                  <button disabled={submitting} className="button-secondary min-h-10 px-3 text-xs">{action === "deposit" ? "Verify & deposit" : "Process withdrawal"}</button>
                </form>)}
              </div>
            </article>)}
            {data.accounts.length === 0 && <p className="rounded-xl bg-white p-5 text-sm text-muted">No store accounts registered.</p>}
          </section>}
          {tab === "orders" && <section className="space-y-4">
            {data.orders.map((order) => <article key={order.id} className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{order.id}</h2><p className="mt-1 text-xs text-muted">Buyer {order.buyerStoreId} · {new Date(order.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-sage px-3 py-1 text-xs">{order.status}</span></div>
              <p className="mt-3 text-sm">{order.items.map((item) => `${item.name} × ${item.quantity}${item.sellerStoreId ? ` · seller ${item.sellerStoreId}` : ""}`).join(", ")}</p>
              <p className="mt-2 text-xs text-muted">Selected payment method: {order.paymentMethod} (demo only)</p>
              <p className="mt-2 text-sm font-medium">{formatPrice(order.totalMMK)}</p><p className="mt-2 whitespace-pre-line text-xs text-muted">{order.address}</p>
              {order.status === "Processing" && <button disabled={submitting} onClick={() => void act({ action: "deliver", orderId: order.id })} className="button-primary mt-4 min-h-10 px-4 text-xs">Confirm successful delivery & credit sellers</button>}
            </article>)}
            {data.orders.length === 0 && <p className="rounded-xl bg-white p-5 text-sm text-muted">No customer orders yet.</p>}
          </section>}
          {tab === "support" && <section className="space-y-4">
            {data.tickets.map((ticket) => <article key={ticket.id} className="rounded-xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap justify-between gap-2"><strong>{ticket.id} · {ticket.storeId}</strong><span className="text-xs text-muted">{ticket.status} · {new Date(ticket.createdAt).toLocaleString()}</span></div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{ticket.message}</p>
              {ticket.resolution && <p className="mt-2 text-sm text-muted">Resolution: {ticket.resolution}</p>}
              {ticket.status === "Open" && <form onSubmit={(event) => { event.preventDefault(); const note = String(new FormData(event.currentTarget).get("note") ?? ""); void act({ action: "resolve", ticketId: ticket.id, note }); }} className="mt-4 flex flex-wrap gap-2">
                <input name="note" maxLength={1000} placeholder="Resolution note (optional)" className="form-input min-w-[220px] flex-1 rounded-lg border-black/15 text-sm" />
                <button disabled={submitting} className="button-secondary">Resolve ticket</button>
              </form>}
            </article>)}
            {data.tickets.length === 0 && <p className="rounded-xl bg-white p-5 text-sm text-muted">No support tickets yet.</p>}
          </section>}
          {tab === "wallet" && <section className="overflow-x-auto rounded-xl bg-white p-5 shadow-soft">
            <h2 className="mb-4 font-display text-2xl">Wallet audit ledger</h2>
            <table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-black/10 text-xs text-muted"><th className="p-3">Date</th><th className="p-3">Store ID</th><th className="p-3">Action</th><th className="p-3 text-right">Amount</th><th className="p-3">Note</th></tr></thead><tbody>
              {data.walletEntries.map((entry) => <tr key={entry.id} className="border-b border-black/5"><td className="p-3">{new Date(entry.createdAt).toLocaleString()}</td><td className="p-3">{entry.storeId}</td><td className="p-3">{entry.action}</td><td className="p-3 text-right">{formatPrice(entry.amountMMK)}</td><td className="p-3">{entry.note || "—"}</td></tr>)}
              {data.walletEntries.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-muted">No wallet activity.</td></tr>}
            </tbody></table>
          </section>}
        </>
      )}
      <p className="mt-8 max-w-3xl text-xs leading-5 text-muted">Passwords are never shown to staff; only a salted scrypt hash is stored. This local JSON ledger is for a single-server prototype, not real-money payment processing. Verify every deposit and withdrawal outside this demo before recording it.</p>
    </div>
  );
}
