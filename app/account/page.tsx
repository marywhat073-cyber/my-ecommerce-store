"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Store, Wallet } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { countryPhoneCodes, defaultCountryCode, type CountryPhoneCode } from "@/lib/countries";
import { useLocale } from "@/context/LocaleContext";

const categories = ["Home", "Kitchen", "Wellness", "Accessories", "Stationery"];

export default function AccountPage() {
  const {
    user,
    sellerProducts,
    orders,
    transactions,
    hydrated,
    register,
    login,
    logout,
    enableSellerMode,
    addSellerProduct,
    recordWalletTransaction,
  } = useApp();
  const router = useRouter();
  const { t } = useLocale();
  const [registerMode, setRegisterMode] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryPhoneCode["code"]>(defaultCountryCode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [method, setMethod] = useState<"K Pay" | "Wave Pay">("K Pay");
  const [walletAction, setWalletAction] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [amount, setAmount] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const myOrders = orders.filter((order) => user !== null && order.sellerIds.includes(user.userId));
  const purchases = orders.filter((order) => order.buyerId === user?.userId);
  const myTransactions = transactions.filter((transaction) => transaction.userId === user?.userId);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      if (registerMode) {
        await register({
          name: String(data.get("name") ?? ""),
          phone: `${countryPhoneCodes.find((country) => country.code === selectedCountry)?.dialCode ?? "+95"}${String(data.get("phone") ?? "").replace(/\D/g, "").replace(/^0+/, "")}`,
          password: String(data.get("password") ?? ""),
        });
      } else {
        await login(
          `${countryPhoneCodes.find((country) => country.code === selectedCountry)?.dialCode ?? "+95"}${String(data.get("phone") ?? "").replace(/\D/g, "").replace(/^0+/, "")}`,
          String(data.get("password") ?? ""),
        );
      }
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to access this account.");
    }
  }

  function handleWalletAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value <= 0) {
      setError("Enter a positive whole amount in MMK.");
      return;
    }
    if (walletAction === "Withdrawal" && value > (user?.walletBalance ?? 0)) {
      setError("Your demo wallet balance is not sufficient for this withdrawal.");
      return;
    }
    recordWalletTransaction({ type: walletAction, method, amount: value });
    setNotice(`${walletAction} recorded as a demo ${method} transaction.`);
    setAmount("");
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a product image to upload.");
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
      setError("Upload an image file no larger than 1 MB.");
      return;
    }
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read the image."));
        reader.onerror = () => reject(new Error("Unable to read the image."));
        reader.readAsDataURL(file);
      });
      const name = String(data.get("productName") ?? "").trim();
      const costPrice = Number(data.get("costPrice"));
      const sellingPrice = Number(data.get("sellingPrice"));
      if (!name || !Number.isSafeInteger(costPrice) || costPrice < 0 || !Number.isSafeInteger(sellingPrice) || sellingPrice < 1 || sellingPrice < costPrice) {
        setError("Enter a valid name and whole-MMK prices. Selling price must be at least the cost price.");
        return;
      }
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
      const product: Product = {
        id: `seller-${Date.now()}`,
        slug,
        name,
        category: String(data.get("category") ?? "Home"),
        costPrice,
        price: sellingPrice,
        currency: "MMK",
        rating: 0,
        reviewCount: 0,
        badge: "Own Store",
        description: String(data.get("description") ?? "").trim(),
        details: ["Listed by an Evergreen seller"],
        images: [image],
        sellerId: user?.userId,
      };
      addSellerProduct(product);
      form.reset();
      setNotice("Your product was added to the catalog.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to list this product.");
    }
  }

  if (!hydrated) return <div className="page-wrap py-20 text-center text-sm text-muted">Loading your account…</div>;

  if (!user) {
    return (
      <div className="page-wrap py-12 md:py-16">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-soft sm:p-9">
          <p className="eyebrow">{t("account.title")}</p>
          <h1 className="mt-2 font-display text-3xl">{registerMode ? t("account.register") : t("account.welcome")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{t("account.authDescription")}</p>
          <form onSubmit={handleAuth} className="mt-7 space-y-4">
            {registerMode && <label className="block text-sm">{t("account.fullName")}<input name="name" required autoComplete="name" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>}
            <div className="grid grid-cols-[minmax(150px,0.95fr)_minmax(0,1.4fr)] gap-3">
              <label className="block text-sm">{t("account.country")}
                <select aria-label={t("account.country")} value={selectedCountry} onChange={(event) => {
                  const country = countryPhoneCodes.find((item) => item.code === event.target.value);
                  if (country) setSelectedCountry(country.code);
                }} className="form-select mt-2 w-full rounded-lg border-black/15 text-sm">
                  {countryPhoneCodes.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.name} ({country.dialCode})</option>)}
                </select>
              </label>
              <label className="block text-sm">{t("account.phone")}
                <div className="mt-2 flex items-center rounded-lg border border-black/15 bg-white focus-within:ring-2 focus-within:ring-leaf">
                  <span aria-hidden="true" className="shrink-0 border-r border-black/10 px-3 text-sm text-muted">{countryPhoneCodes.find((country) => country.code === selectedCountry)?.dialCode}</span>
                  <input name="phone" required type="tel" inputMode="numeric" autoComplete="tel-national" className="form-input min-w-0 w-full rounded-r-lg border-0 text-sm focus:ring-0" placeholder={t("account.phonePlaceholder")} />
                </div>
              </label>
            </div>
            <label className="block text-sm">{t("account.password")}
              <div className="mt-2 flex items-center rounded-lg border border-black/15 bg-white focus-within:ring-2 focus-within:ring-leaf">
                <input name="password" required type={showPassword ? "text" : "password"} minLength={6} autoComplete={registerMode ? "new-password" : "current-password"} className="form-input min-w-0 w-full rounded-l-lg border-0 focus:ring-0" />
                <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? t("account.hidePassword") : t("account.showPassword")} aria-pressed={showPassword} className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sage hover:text-forest">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="mt-1 block text-xs text-muted">{t("account.passwordHint")}</span>
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button className="button-primary w-full">{registerMode ? t("account.create") : t("account.signIn")}</button>
          </form>
          <button onClick={() => { setRegisterMode((current) => !current); setError(""); }} className="mt-5 w-full text-center text-sm text-forest underline underline-offset-4">
            {registerMode ? t("account.toggleToSignIn") : t("account.toggleToRegister")}
          </button>
          <p className="mt-5 rounded-lg bg-sage p-3 text-xs leading-5 text-ink/70">Registration assigns a unique local ID such as USER-123456. Passwords are hashed in this browser only; use a secure server for real accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Your account</p><h1 className="section-title mt-2">Hello, {user.name}</h1><p className="mt-2 text-sm text-muted">User ID: <strong className="text-ink">{user.userId}</strong> · {user.phone}</p></div>
        <button onClick={logout} className="button-secondary">Sign out</button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-sage p-3 text-sm text-forest">{notice}</p>}
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <section className="space-y-7">
          <div className="rounded-xl bg-white p-6 shadow-soft">
            <h2 className="font-display text-2xl">Your purchases</h2>
            <div className="mt-4 space-y-3">
              {purchases.map((order) => <article key={order.id} className="rounded-lg border border-black/10 p-4"><div className="flex justify-between gap-3 text-sm"><strong>{order.id}</strong><span>{formatPrice(order.total)}</span></div><p className="mt-2 text-xs text-muted">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p><p className="mt-2 text-xs text-muted">Payment choice: {order.paymentMethod} (demo) · {new Date(order.createdAt).toLocaleString()}</p></article>)}
              {purchases.length === 0 && <p className="text-sm text-muted">Your completed demo orders will appear here.</p>}
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Seller account mode</p><h2 className="mt-1 font-display text-2xl">{user.isSeller ? "Your own store" : "Start your own store"}</h2></div><Store className="text-leaf" size={25} /></div>
            <p className="mt-3 text-sm leading-6 text-muted">{user.isSeller ? "Manage your listed products and see orders that include your items." : "Upgrade this account to list products with your cost and selling prices."}</p>
            {!user.isSeller && <button onClick={enableSellerMode} className="button-primary mt-5">Enable Seller Account</button>}
            {user.isSeller && (
              <>
                <form onSubmit={handleProductSubmit} className="mt-6 space-y-4 border-t border-black/10 pt-6">
                  <h3 className="font-display text-xl">List a product</h3>
                  <label className="block text-sm">Product name<input name="productName" required maxLength={80} className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
                  <label className="block text-sm">Description<textarea name="description" required maxLength={1000} rows={3} className="form-textarea mt-2 w-full rounded-lg border-black/15" /></label>
                  <label className="block text-sm">Category<select name="category" className="form-select mt-2 w-full rounded-lg border-black/15">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm">Cost price (MMK)<input name="costPrice" required min="0" step="1" type="number" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
                    <label className="block text-sm">Selling price (MMK)<input name="sellingPrice" required min="1" step="1" type="number" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
                  </div>
                  <label className="block text-sm">Product image (max 1 MB)<input ref={fileRef} required type="file" accept="image/*" className="form-input mt-2 w-full rounded-lg border-black/15 text-sm" /></label>
                  <p className="text-xs leading-5 text-muted">Product image data is saved in this browser. Avoid large files or sensitive content.</p>
                  <button className="button-primary w-full">Publish to catalog</button>
                </form>
                <div className="mt-6 border-t border-black/10 pt-5">
                  <h3 className="font-display text-xl">Your listings</h3>
                  <div className="mt-3 divide-y divide-black/10">
                    {sellerProducts.filter((product) => product.sellerId === user.userId).map((product) => (
                      <div key={product.id} className="flex items-center gap-3 py-3">
                        <div className="relative h-14 w-12 overflow-hidden rounded-md bg-sand"><Image src={product.images[0]} alt={product.name} fill unoptimized sizes="48px" className="object-cover" /></div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted">Cost {formatPrice(product.costPrice ?? 0)} · Selling {formatPrice(product.price)}</p></div>
                        <Link href={`/products/${product.slug}`} className="text-xs text-forest underline">View</Link>
                      </div>
                    ))}
                    {sellerProducts.every((product) => product.sellerId !== user.userId) && <p className="py-3 text-sm text-muted">You have not listed any products yet.</p>}
                  </div>
                </div>
              </>
            )}
          </div>
          {user.isSeller && (
            <div className="rounded-xl bg-white p-6 shadow-soft">
              <h2 className="font-display text-2xl">Orders for your store</h2>
              <div className="mt-4 space-y-4">
                {myOrders.map((order) => {
                  const sellerItems = order.items.filter((item) => item.sellerId === user.userId);
                  const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                  return <article key={order.id} className="rounded-lg border border-black/10 p-4">
                    <div className="flex justify-between gap-3 text-sm"><strong>{order.id}</strong><span>{formatPrice(sellerSubtotal)}</span></div>
                    <p className="mt-2 text-sm">{order.buyerName} · {order.buyerPhone}</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted">{order.address}</p>
                    {order.coordinates && <p className="mt-1 text-xs text-muted">Buyer-shared GPS: {order.coordinates.latitude.toFixed(6)}, {order.coordinates.longitude.toFixed(6)}</p>}
                    <p className="mt-2 text-xs text-muted">{sellerItems.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p>
                  </article>
                })}
                {myOrders.length === 0 && <p className="text-sm text-muted">No orders for your products yet.</p>}
              </div>
            </div>
          )}
        </section>
        <aside className="space-y-7">
          <section className="rounded-xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between"><div><p className="eyebrow">Demo wallet</p><h2 className="mt-1 font-display text-2xl">{formatPrice(user.walletBalance)}</h2></div><Wallet size={25} className="text-leaf" /></div>
            <p className="mt-3 text-xs leading-5 text-muted">Simulated only. No deposits or withdrawals are sent to K Pay or Wave Pay. Never enter wallet PINs or payment passwords here.</p>
            <form onSubmit={handleWalletAction} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(["Deposit", "Withdrawal"] as const).map((action) => <button key={action} type="button" onClick={() => setWalletAction(action)} className={`rounded-full border px-3 py-2 text-sm ${walletAction === action ? "border-forest bg-sage text-forest" : "border-black/15"}`}>{action}</button>)}
              </div>
              <label className="block text-sm">Payment method<select value={method} onChange={(event) => setMethod(event.target.value as "K Pay" | "Wave Pay")} className="form-select mt-2 w-full rounded-lg border-black/15"><option>K Pay</option><option>Wave Pay</option></select></label>
              <label className="block text-sm">Amount (MMK)<input value={amount} onChange={(event) => setAmount(event.target.value)} required min="1" step="1" type="number" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <button className="button-primary w-full">Record demo {walletAction.toLowerCase()}</button>
            </form>
            {transactions.length > 0 && <div className="mt-5 border-t border-black/10 pt-4"><h3 className="text-sm font-semibold">Recent demo transactions</h3><ul className="mt-2 space-y-2">{myTransactions.slice(0, 5).map((transaction) => <li key={transaction.id} className="flex justify-between gap-3 text-xs"><span>{transaction.type} · {transaction.method}</span><span>{formatPrice(transaction.amount)}</span></li>)}</ul></div>}
          </section>
          <Link href="/products" className="flex items-center justify-between rounded-xl bg-sage p-5 text-sm font-medium text-forest">Browse the catalog <ArrowRight size={17} /></Link>
        </aside>
      </div>
    </div>
  );
}
