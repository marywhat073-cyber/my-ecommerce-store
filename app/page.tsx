"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Store } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useApp } from "@/context/AppContext";
import { useLocale } from "@/context/LocaleContext";
import { categories, products } from "@/lib/products";
import { formatPrice } from "@/lib/format";

export default function HomePage() {
  const { user, register, login } = useApp();
  const { language, t } = useLocale();
  const [loginMode, setLoginMode] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const myanmar = language === "my";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const values = new FormData(event.currentTarget);
    try {
      if (loginMode) {
        await login(String(values.get("phone") ?? ""), String(values.get("password") ?? ""));
      } else {
        await register({
          phone: String(values.get("phone") ?? ""),
          storeName: String(values.get("storeName") ?? ""),
          storeAddress: String(values.get("storeAddress") ?? ""),
          password: String(values.get("password") ?? ""),
          invitationCode: String(values.get("invitationCode") ?? ""),
        });
        setNotice(myanmar
          ? "သင့်ဆိုင်ကို မှတ်ပုံတင်ပြီးပါပြီ။ ဆိုင် ID နှင့် ပိုက်ဆံအိတ်ဆုကြေးကို သင့်အကောင့်တွင် ကြည့်နိုင်ပါသည်။"
          : "Your store is registered. Your Store ID and wallet details are ready in your account.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to complete registration.");
    }
  }

  if (!user) {
    return (
      <div className="page-wrap flex min-h-[calc(100vh-2rem)] items-center justify-center py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-soft lg:grid-cols-[1fr_0.9fr]">
          <div className="relative hidden min-h-[690px] bg-sage lg:block">
            <Image
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"
              alt={myanmar ? "ပစ္စည်းများနှင့် အလှဆင်ထားသော နေအိမ်" : "A thoughtfully styled home interior"}
              fill
              priority
              sizes="(max-width: 1024px) 0px, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">{myanmar ? "ဆိုင်ရှင်များအတွက်" : "For independent store owners"}</p>
              <h1 className="mt-4 max-w-lg font-display text-4xl leading-tight">{myanmar ? "ဆိုင်ဖွင့်ပါ။ ကြိုတင်ကုန်ကျစရိတ်မလိုပါ။" : "Open your store. Start without upfront inventory costs."}</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/80">{myanmar ? "အော်ဒါရရှိပြီး ပစ္စည်းပို့ဆောင်ပြီးမှသာ ကုန်ပစ္စည်းကုန်ကျစရိတ်ကို ပေးချေပါ။" : "List products for free. Product cost is due only when a customer orders."}</p>
            </div>
          </div>
          <div className="px-7 py-9 sm:px-10 sm:py-12">
            <div className="flex items-center gap-3 text-forest"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage"><Store size={21} /></span><span className="font-display text-2xl">Evergreen Market</span></div>
            <p className="eyebrow mt-9">{myanmar ? "ဆိုင်အကောင့်" : "Store account"}</p>
            <h2 className="mt-2 font-display text-3xl">{loginMode ? (myanmar ? "ပြန်လည်ဝင်ရောက်ပါ" : "Welcome back") : (myanmar ? "သင့်ဆိုင်ကို စတင်မှတ်ပုံတင်ပါ" : "Register your store")}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{myanmar ? "စတင်ရန် ဆိုင်အကောင့်တစ်ခု ဖန်တီးပါ။" : "Create your store account to browse the catalog and start selling."}</p>
            <form onSubmit={(event) => void handleSubmit(event)} className="mt-7 space-y-4">
              <label className="block text-sm">{myanmar ? "ဖုန်းနံပါတ်" : "Phone number"}
                <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+95 9 123 456 789" className="form-input mt-2 w-full rounded-lg border-black/15" />
              </label>
              {!loginMode && <>
                <label className="block text-sm">{myanmar ? "ဆိုင်အမည်" : "Store name"}
                  <input name="storeName" required minLength={2} maxLength={100} autoComplete="organization" className="form-input mt-2 w-full rounded-lg border-black/15" />
                </label>
                <label className="block text-sm">{myanmar ? "ဆိုင်လိပ်စာ" : "Store address"}
                  <textarea name="storeAddress" required minLength={5} maxLength={300} rows={2} autoComplete="street-address" className="form-textarea mt-2 w-full rounded-lg border-black/15" />
                </label>
              </>}
              <label className="block text-sm">{myanmar ? "စကားဝှက်" : "Password"}
                <input name="password" required type="password" minLength={8} maxLength={128} autoComplete={loginMode ? "current-password" : "new-password"} className="form-input mt-2 w-full rounded-lg border-black/15" />
                {!loginMode && <span className="mt-1 block text-xs text-muted">{myanmar ? "အနည်းဆုံး စာလုံး ၈ လုံး" : "Use at least 8 characters."}</span>}
              </label>
              {!loginMode && <label className="block text-sm">{myanmar ? "ဖိတ်ခေါ်မှုကုဒ် (ရွေးချယ်နိုင်သည်)" : "Invitation code (optional)"}
                <input name="invitationCode" maxLength={80} autoComplete="off" className="form-input mt-2 w-full rounded-lg border-black/15" />
              </label>}
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              {notice && <p role="status" className="rounded-lg bg-sage p-3 text-sm text-forest">{notice}</p>}
              <button className="button-primary w-full">{loginMode ? (myanmar ? "ဝင်ရောက်ရန်" : "Sign in") : (myanmar ? "ဆိုင်မှတ်ပုံတင်ရန်" : "Create store account")} <ArrowRight size={17} /></button>
            </form>
            <button type="button" onClick={() => { setLoginMode((value) => !value); setError(""); setNotice(""); }} className="mt-5 w-full text-center text-sm text-forest underline underline-offset-4">
              {loginMode ? (myanmar ? "ဆိုင်အသစ် မှတ်ပုံတင်ရန်" : "Register a new store") : (myanmar ? "အကောင့်ရှိပြီးသားလား။ ဝင်ရောက်ရန်" : "Already registered? Sign in")}
            </button>
            <p className="mt-5 rounded-xl bg-sage/70 p-3 text-xs leading-5 text-ink/75">
              {myanmar
                ? "မှတ်ပုံတင်ထားသော ဖိတ်ခေါ်ကုဒ်ဖြင့် $30 ဆုကြေးရရှိမည်။ အောင်မြင်သော အော်ဒါအနည်းဆုံးတစ်ခု ပို့ဆောင်ပြီးမှသာ ထုတ်ယူနိုင်ပါမည်။"
                : "Every store gets a unique referral code. A valid referral gives both stores $30.00 (~ 135,000 MMK); each store's bonus unlocks after that store completes a delivered product sale."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="page-wrap pb-12 pt-7 md:pb-16 md:pt-10">
        <div className="relative min-h-[430px] overflow-hidden rounded-2xl bg-[#e8e6dc] md:min-h-[520px]">
          <Image src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=90" alt={t("home.heroImageAlt")} fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1d2923]/75 via-[#1d2923]/30 to-transparent" />
          <div className="relative flex min-h-[430px] max-w-xl flex-col items-start justify-center px-7 py-12 text-white sm:px-12 md:min-h-[520px] md:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">{myanmar ? "ကြိုတင်ကုန်ကျစရိတ်မလိုသော အွန်လိုင်းစတိုး" : "A no-upfront-cost store platform"}</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.07] tracking-tight sm:text-6xl">{myanmar ? "ရောင်းချရန် စတင်ပါ။" : "Make room for your next sale."}</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/85">{myanmar ? "ကုန်ပစ္စည်းများကို အခမဲ့စာရင်းသွင်းပါ။ အော်ဒါပို့ဆောင်ပြီးနောက် ကုန်ကျစရိတ်နှင့် အမြတ် ၁၀% ရရှိပါမည်။" : "List products for free. On successful delivery, earn the product cost plus 10% sales profit."}</p>
            <Link href="/products" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-forest transition hover:bg-sage">{t("home.explore")} <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
      <section className="page-wrap py-8">
        <div className="grid gap-4 rounded-xl bg-sage p-5 sm:grid-cols-3 sm:p-7">
          <div><p className="eyebrow">{myanmar ? "ဆိုင် ID" : "Store ID"}</p><p className="mt-2 font-semibold">{user.storeId}</p></div>
          <div><p className="eyebrow">{myanmar ? "ပိုက်ဆံအိတ်" : "Wallet balance"}</p><p className="mt-2 font-semibold">{formatPrice(user.walletBalanceMMK)}</p></div>
          <div><p className="eyebrow">{myanmar ? "ဖိတ်ခေါ်ဆုကြေးအခြေအနေ" : "Referral bonuses"}</p><p className="mt-2 font-semibold">{user.signupBonusMMK + user.referralBonusMMK ? (user.bonusUnlocked ? (myanmar ? "ထုတ်ယူနိုင်သည်" : "Unlocked") : (myanmar ? "အော်ဒါပို့ဆောင်ရန်လိုသည်" : "Locked until a sale is delivered")) : (myanmar ? "မရှိပါ" : "Not applicable")}</p></div>
        </div>
      </section>
      <section className="page-wrap py-10 md:py-14">
        <div className="mb-7"><p className="eyebrow">{t("home.categoryEyebrow")}</p><h2 className="section-title mt-2">{t("home.categoryTitle")}</h2></div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => <Link key={category.name} href={`/products?category=${encodeURIComponent(category.name)}`} className="group relative aspect-[5/4] overflow-hidden rounded-xl bg-sand">
            <Image src={category.image} alt={`${category.name} collection`} fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 font-display text-lg text-white sm:text-xl">{t(`category.${category.name}`)}</div>
          </Link>)}
        </div>
      </section>
      <section className="page-wrap py-10 md:py-14">
        <div className="mb-7"><p className="eyebrow">{t("home.favoritesEyebrow")}</p><h2 className="section-title mt-2">{t("home.favoritesTitle")}</h2></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
    </>
  );
}
