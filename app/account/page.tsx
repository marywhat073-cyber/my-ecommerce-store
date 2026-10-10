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
    createSellerStore,
    addSellerProduct,
    recordWalletTransaction,
  } = useApp();
  const router = useRouter();
  const { language, t } = useLocale();
  const [registerMode, setRegisterMode] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryPhoneCode["code"]>(defaultCountryCode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [method, setMethod] = useState<"K Pay" | "Wave Money">("K Pay");
  const [walletAction, setWalletAction] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [amount, setAmount] = useState("");
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [selectedStoreCategories, setSelectedStoreCategories] = useState<string[]>([]);
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
      setError(t(reason instanceof Error ? reason.message : "account.error.generic"));
    }
  }

  function handleStoreSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      createSellerStore({
        name: String(data.get("storeName") ?? ""),
        address: String(data.get("storeAddress") ?? ""),
        categories: selectedStoreCategories,
      });
      setNotice(t("account.success.store"));
    } catch (reason) {
      setError(t(reason instanceof Error ? reason.message : "account.error.generic"));
    }
  }

  async function handleWalletAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = Number(data.get("amount"));
    if (!Number.isSafeInteger(value) || value <= 0) {
      setError(t("account.error.depositAmount"));
      return;
    }
    const accountNumber = String(data.get("accountNumber") ?? "").trim();
    const accountName = String(data.get("accountName") ?? "").trim();
    const receiptLast5 = String(data.get("receiptLast5") ?? "").trim();
    const receipt = data.get("receipt");
    const receiptFile = receipt instanceof File && receipt.size > 0 ? receipt : null;
    if (!accountNumber || !accountName) {
      setError(t("wallet.error.invalidAccount"));
      return;
    }
    if (receiptLast5 && !/^\d{5}$/.test(receiptLast5)) {
      setError(t("wallet.error.invalidReceiptDigits"));
      return;
    }
    if (!receiptFile && !/^\d{5}$/.test(receiptLast5)) {
      setError(t("wallet.error.receiptRequired"));
      return;
    }
    if (receiptFile && (receiptFile.size > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(receiptFile.type))) {
      setError(t("wallet.error.invalidReceiptFile"));
      return;
    }
    setWalletSubmitting(true);
    try {
      const request = new FormData();
      request.set("type", walletAction);
      request.set("method", method);
      request.set("accountNumber", accountNumber);
      request.set("accountName", accountName);
      request.set("amount", String(value));
      request.set("receiptLast5", receiptLast5);
      request.set("userId", user?.userId ?? "");
      request.set("userName", user?.name ?? "");
      request.set("userPhone", user?.phone ?? "");
      if (receiptFile) request.set("receipt", receiptFile, receiptFile.name);

      const response = await fetch("/api/wallet", { method: "POST", body: request });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(t(result.error ?? "wallet.error.telegramUnavailable"));
        return;
      }

      recordWalletTransaction({
        type: walletAction,
        method,
        amount: value,
        accountNumberLast4: accountNumber.replace(/\D/g, "").slice(-4),
        receiptLast5: receiptLast5 || undefined,
        receiptUploaded: Boolean(receiptFile),
      });
      setNotice(`${t(`account.${walletAction.toLowerCase()}`)} · ${t("wallet.success")}`);
      setAmount("");
      form.reset();
      setMethod("K Pay");
    } catch (reason) {
      setError(t(reason instanceof Error ? reason.message : "wallet.error.telegramUnavailable"));
    } finally {
      setWalletSubmitting(false);
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError(t("account.error.productImage"));
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
      setError(t("account.error.imageType"));
      return;
    }
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("account.error.readImage"));
        reader.onerror = () => reject(new Error("account.error.readImage"));
        reader.readAsDataURL(file);
      });
      const name = String(data.get("productName") ?? "").trim();
      const costPrice = Number(data.get("costPrice"));
      const sellingPrice = Number(data.get("sellingPrice"));
      if (!name || !Number.isSafeInteger(costPrice) || costPrice < 0 || !Number.isSafeInteger(sellingPrice) || sellingPrice < 1 || sellingPrice < costPrice) {
        setError(t("account.error.productPrice"));
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
      setNotice(t("account.success.product"));
    } catch (reason) {
      setError(t(reason instanceof Error ? reason.message : "account.error.productUpload"));
    }
  }

  if (!hydrated) return <div className="page-wrap py-20 text-center text-sm text-muted">{t("account.loading")}</div>;

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
                      {countryPhoneCodes.map((country) => {
                        const countryName = new Intl.DisplayNames([language], { type: "region" }).of(country.code) ?? country.name;
                        return <option key={country.code} value={country.code}>{country.flag} {countryName} ({country.dialCode})</option>;
                      })}
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
          <p className="mt-5 rounded-lg bg-sage p-3 text-xs leading-5 text-ink/70">{t("account.registrationNotice")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{user.store ? t("account.sellerDashboard") : t("account.yourAccount")}</p>
          <h1 className="section-title mt-2">{user.store ? user.store.name : `${t("account.hello")}, ${user.name}`}</h1>
          <p className="mt-2 text-sm text-muted">{t("account.userId")}: <strong className="text-ink">{user.userId}</strong> · {user.phone}</p>
        </div>
        <button onClick={logout} className="button-secondary">{t("account.signOut")}</button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-sage p-3 text-sm text-forest">{notice}</p>}
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <section className="space-y-7">
          <div className="rounded-xl bg-white p-6 shadow-soft">
            <h2 className="font-display text-2xl">{t("account.purchases")}</h2>
            <div className="mt-4 space-y-3">
              {purchases.map((order) => <article key={order.id} className="rounded-lg border border-black/10 p-4"><div className="flex justify-between gap-3 text-sm"><strong>{order.id}</strong><span>{formatPrice(order.total)}</span></div><p className="mt-2 text-xs text-muted">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p><p className="mt-2 text-xs text-muted">{t("account.paymentChoice")}: {order.paymentMethod} ({t("account.demoLabel")}) · {new Date(order.createdAt).toLocaleString(language)}</p></article>)}
              {purchases.length === 0 && <p className="text-sm text-muted">{t("account.completedOrders")}</p>}
            </div>
          </div>
          {!user.store ? (
            <div className="rounded-xl bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div><p className="eyebrow">{t("account.sellerDashboard")}</p><h2 className="mt-1 font-display text-2xl">{t("account.startStore")}</h2></div>
                <Store className="text-leaf" size={25} />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{t("account.storeDescription")}</p>
              <form onSubmit={handleStoreSubmit} className="mt-5 space-y-4">
                <label className="block text-sm">{t("account.storeName")}<input name="storeName" required maxLength={80} className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
                <label className="block text-sm">{t("account.storeAddress")}<textarea name="storeAddress" required maxLength={300} rows={3} placeholder={t("account.storeAddressPlaceholder")} className="form-textarea mt-2 w-full rounded-lg border-black/15" /></label>
                <fieldset>
                  <legend className="mb-2 text-sm">{t("account.productCategories")}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 rounded-lg border border-black/10 p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedStoreCategories.includes(category)}
                          onChange={(event) => setSelectedStoreCategories((current) => event.target.checked
                            ? [...current, category]
                            : current.filter((item) => item !== category))}
                          className="rounded border-black/20 text-forest focus:ring-leaf"
                        />
                        {t(`category.${category}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button className="button-primary w-full">{t("account.createStore")}</button>
              </form>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div><p className="eyebrow">{t("account.storeProfile")}</p><h2 className="mt-1 font-display text-2xl">{user.store.name}</h2></div>
                <Store className="text-leaf" size={25} />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">{user.store.address}</p>
              <p className="mt-3 text-sm font-medium">{t("account.productCategories")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.store.categories.map((category) => <span key={category} className="rounded-full bg-sage px-3 py-1 text-xs text-forest">{t(`category.${category}`)}</span>)}
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">{t("account.manageStore")}</p>
              <form onSubmit={handleProductSubmit} className="mt-6 space-y-4 border-t border-black/10 pt-6">
                <h3 className="font-display text-xl">{t("account.listProduct")}</h3>
                <label className="block text-sm">{t("account.productName")}<input name="productName" required maxLength={80} className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
                <label className="block text-sm">{t("account.description")}<textarea name="description" required maxLength={1000} rows={3} className="form-textarea mt-2 w-full rounded-lg border-black/15" /></label>
                <label className="block text-sm">{t("account.category")}<select name="category" className="form-select mt-2 w-full rounded-lg border-black/15">{user.store.categories.map((category) => <option key={category} value={category}>{t(`category.${category}`)}</option>)}</select></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">{t("account.costPrice")}<input name="costPrice" required min="0" step="1" type="number" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
                  <label className="block text-sm">{t("account.sellingPrice")}<input name="sellingPrice" required min="1" step="1" type="number" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
                </div>
                <label className="block text-sm">{t("account.productImage")}<input ref={fileRef} required type="file" accept="image/*" className="form-input mt-2 w-full rounded-lg border-black/15 text-sm" /></label>
                <p className="text-xs leading-5 text-muted">{t("account.imageNotice")}</p>
                <button className="button-primary w-full">{t("account.publishProduct")}</button>
              </form>
              <div className="mt-6 border-t border-black/10 pt-5">
                <h3 className="font-display text-xl">{t("account.listings")}</h3>
                <div className="mt-3 divide-y divide-black/10">
                  {sellerProducts.filter((product) => product.sellerId === user.userId).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 py-3">
                      <div className="relative h-14 w-12 overflow-hidden rounded-md bg-sand"><Image src={product.images[0]} alt={product.name} fill unoptimized sizes="48px" className="object-cover" /></div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted">{t("account.cost")} {formatPrice(product.costPrice ?? 0)} · {t("account.selling")} {formatPrice(product.price)}</p></div>
                      <Link href={`/products/${product.slug}`} className="text-xs text-forest underline">{t("account.view")}</Link>
                    </div>
                  ))}
                  {sellerProducts.every((product) => product.sellerId !== user.userId) && <p className="py-3 text-sm text-muted">{t("account.noListings")}</p>}
                </div>
              </div>
            </div>
          )}
          {user.store && (
            <div className="rounded-xl bg-white p-6 shadow-soft">
              <h2 className="font-display text-2xl">{t("account.storeOrders")}</h2>
              <div className="mt-4 space-y-4">
                {myOrders.map((order) => {
                  const sellerItems = order.items.filter((item) => item.sellerId === user.userId);
                  const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
                  return <article key={order.id} className="rounded-lg border border-black/10 p-4">
                    <div className="flex justify-between gap-3 text-sm"><strong>{order.id}</strong><span>{formatPrice(sellerSubtotal)}</span></div>
                    <p className="mt-2 text-sm">{order.buyerName} · {order.buyerPhone}</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted">{order.address}</p>
                    {order.coordinates && <p className="mt-1 text-xs text-muted">{t("account.buyerGps")}: {order.coordinates.latitude.toFixed(6)}, {order.coordinates.longitude.toFixed(6)}</p>}
                    <p className="mt-2 text-xs text-muted">{sellerItems.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p>
                  </article>;
                })}
                {myOrders.length === 0 && <p className="text-sm text-muted">{t("account.noStoreOrders")}</p>}
              </div>
            </div>
          )}
        </section>
        <aside className="space-y-7">
          <section className="rounded-xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between"><div><p className="eyebrow">{t("account.demoWallet")}</p><h2 className="mt-1 font-display text-2xl">{formatPrice(user.walletBalance)}</h2></div><Wallet size={25} className="text-leaf" /></div>
            <p className="mt-3 text-xs leading-5 text-muted">{t("account.walletNotice")}</p>
            <form onSubmit={handleWalletAction} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(["Deposit", "Withdrawal"] as const).map((action) => <button key={action} type="button" onClick={() => setWalletAction(action)} className={`rounded-full border px-3 py-2 text-sm ${walletAction === action ? "border-forest bg-sage text-forest" : "border-black/15"}`}>{t(`account.${action.toLowerCase()}`)}</button>)}
              </div>
              {walletAction === "Deposit" && <div className="rounded-xl border border-forest/20 bg-sage/60 p-4 text-sm shadow-sm"><p className="mb-2 font-semibold text-forest">{t("account.depositDetails")}</p><p>Wave Money: Mg Kyaw Zin Phyo (09775191427)</p><p>K Pay: Mg Kyaw Zin Phyo (09775191427)</p></div>}
              <label className="block text-sm">{t("wallet.method")}<select name="method" value={method} onChange={(event) => setMethod(event.target.value as "K Pay" | "Wave Money")} className="form-select mt-2 w-full rounded-lg border-black/15"><option value="K Pay">{t("wallet.method.kpay")}</option><option value="Wave Money">{t("wallet.method.wave")}</option></select></label>
              <label className="block text-sm">{t("wallet.accountNumber")}<input name="accountNumber" required maxLength={64} autoComplete="off" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <label className="block text-sm">{t("wallet.accountName")}<input name="accountName" required maxLength={120} autoComplete="off" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <label className="block text-sm">{t("account.amount")}<input name="amount" value={amount} onChange={(event) => setAmount(event.target.value)} required min="1" step="1" type="number" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <fieldset className="space-y-3">
                <legend className="text-sm">{t("wallet.receipt")}</legend>
                <label className="block text-sm">{t("wallet.receiptDigits")}<input name="receiptLast5" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="12345" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
                <p className="text-center text-xs text-muted">{t("wallet.or")}</p>
                <label className="block text-sm">{t("wallet.uploadReceipt")}<input name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="form-input mt-2 w-full rounded-lg border-black/15 text-sm" /></label>
              </fieldset>
              <p className="rounded-lg bg-sand p-3 text-xs leading-5 text-muted">{t("wallet.telegramPrivacy")}</p>
              <button disabled={walletSubmitting} className="button-primary w-full">{walletSubmitting ? t("wallet.submitting") : `${t("account.recordDemo")} ${t(`account.${walletAction.toLowerCase()}`).toLowerCase()}`}</button>
            </form>
            <div className="mt-5 border-t border-black/10 pt-4">
              <h3 className="text-sm font-semibold">{t("wallet.history")}</h3>
              <ul className="mt-3 space-y-3">
                {myTransactions.map((transaction) => (
                  <li key={transaction.id} className="rounded-lg border border-black/10 p-3 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{t(`account.${transaction.type.toLowerCase()}`)} · {transaction.method === "K Pay" ? t("wallet.method.kpay") : t("wallet.method.wave")}</span>
                      <span className="text-right font-semibold">{formatPrice(transaction.amount)}<span className="mt-1 block font-normal text-muted">{t(transaction.status === "Rejected" ? "wallet.rejected" : transaction.status === "Approved" ? "wallet.approved" : "wallet.pendingReview")}</span></span>
                    </div>
                    <p className="mt-1 text-muted">{t("wallet.from")}: ••••{transaction.accountNumberLast4 ?? "—"} · {new Date(transaction.createdAt).toLocaleString(language)}</p>
                    <p className="mt-1 text-muted">{t("wallet.receiptReference")}: {transaction.receiptLast5 ? `${t("wallet.receiptDigitsShort")} ${transaction.receiptLast5}` : transaction.receiptUploaded ? t("wallet.uploaded") : "—"}</p>
                  </li>
                ))}
                {myTransactions.length === 0 && <li className="text-sm text-muted">{t("wallet.emptyHistory")}</li>}
              </ul>
            </div>
          </section>
          <Link href="/products" className="flex items-center justify-between rounded-xl bg-sage p-5 text-sm font-medium text-forest">{t("account.browseCatalog")} <ArrowRight size={17} /></Link>
        </aside>
      </div>
    </div>
  );
}
