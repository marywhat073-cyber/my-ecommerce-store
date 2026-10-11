"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useLocale } from "@/context/LocaleContext";
import { formatPrice, formatPricePair } from "@/lib/format";
import { Store, Wallet } from "lucide-react";

const listingCategories = [
  "Tech, Phones & Computers",
  "Men's Fashion & Grooming",
  "Women's Fashion, Clothing & Lingerie",
  "Women's Makeup & Cosmetics",
  "Skincare & Haircare",
  "Kitchen Appliances & Utensils",
  "Home Cleaning, Decor & Building Materials",
];

export default function AccountPage() {
  const { user, sellerProducts, orders, addSellerProduct, logout, refreshStore } = useApp();
  const { language } = useLocale();
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const myanmar = language === "my";
  const myProducts = sellerProducts.filter((product) => product.sellerId === user?.storeId);

  useEffect(() => {
    void refreshStore().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Unable to refresh store data.");
    });
  }, [refreshStore]);

  async function handleListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      await addSellerProduct({
        id: "",
        slug: "",
        name: String(form.get("name") ?? ""),
        category: String(form.get("category") ?? ""),
        price: 0,
        costPrice: Number(form.get("costPriceMMK")),
        currency: "MMK",
        rating: 0,
        reviewCount: 0,
        badge: "Store Listed",
        description: String(form.get("description") ?? ""),
        details: [],
        images: [String(form.get("imageUrl") ?? "")],
      });
      formElement.reset();
      setNotice(myanmar ? "ကုန်ပစ္စည်းကို ကြိုတင်ငွေပေးစရာမလိုဘဲ စာရင်းသွင်းပြီးပါပြီ။" : "Product listed. There is no upfront listing or inventory charge.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to list the product.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: new FormData(form).get("message") }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to submit support request.");
      form.reset();
      setNotice(myanmar ? "ဖောက်သည်ဝန်ဆောင်မှုထံ အကူအညီတောင်းဆိုချက် ပေးပို့ပြီးပါပြီ။" : "Your support request has been sent to customer service.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit support request.");
    }
  }

  if (!user) return null;

  return (
    <div className="page-wrap py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{myanmar ? "သင့်ဆိုင်" : "Your store"}</p>
          <h1 className="section-title mt-2">{user.storeName}</h1>
          <p className="mt-2 text-sm text-muted">{user.storeId} · {user.phone}</p>
          <p className="mt-1 text-sm text-muted">{user.storeAddress}</p>
        </div>
        <button onClick={() => void logout().then(() => router.replace("/"))} className="button-secondary">{myanmar ? "ထွက်ရန်" : "Sign out"}</button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-sage p-3 text-sm text-forest">{notice}</p>}
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <section className="space-y-7">
          <section className="rounded-xl bg-white p-6 shadow-soft">
            <h2 className="font-display text-2xl">{myanmar ? "သင့်အော်ဒါများ" : "Your orders"}</h2>
            <div className="mt-4 space-y-3">
              {orders.map((order) => <article key={order.id} className="rounded-lg border border-black/10 p-4">
                <div className="flex flex-wrap justify-between gap-2 text-sm"><strong>{order.id}</strong><span className="font-medium">{formatPricePair(order.totalMMK, "MMK")}</span></div>
                <p className="mt-2 text-xs leading-5 text-muted">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</p>
                <p className="mt-2 text-xs text-muted">{myanmar ? "အခြေအနေ" : "Status"}: {order.status} · {order.paymentMethod} ({myanmar ? "စမ်းသပ်ငွေပေးချေမှု" : "demo payment"})</p>
              </article>)}
              {orders.length === 0 && <p className="text-sm text-muted">{myanmar ? "အော်ဒါမရှိသေးပါ။" : "No orders yet."}</p>}
            </div>
          </section>
          <div className="grid gap-4 rounded-xl bg-sage p-6 sm:grid-cols-2">
            <div className="flex items-start gap-3"><Wallet className="mt-1 text-forest" /><div><p className="text-sm text-muted">{myanmar ? "ပိုက်ဆံအိတ်လက်ကျန်" : "Wallet balance"}</p><p className="mt-1 text-xl font-semibold">{formatPrice(user.walletBalanceMMK)}</p></div></div>
            <div><p className="text-sm text-muted">{myanmar ? "ရောင်းချမှုအောင်မြင်ပြီး" : "Successful sales"}</p><p className="mt-1 text-2xl font-semibold">{user.successfulSales}</p></div>
            <div className="sm:col-span-2 rounded-lg bg-white/70 p-4 text-sm leading-6">
              <strong>{formatPrice(user.signupBonusMMK + user.referralBonusMMK)} {myanmar ? "ဖိတ်ခေါ်မှုဆုကြေးများ" : "referral bonuses"}</strong>
              <p className="mt-1 text-muted">{user.signupBonusMMK + user.referralBonusMMK > 0
                ? user.bonusUnlocked
                  ? (myanmar ? "အနည်းဆုံး အော်ဒါတစ်ခု ပို့ဆောင်ပြီး၍ ဆုကြေးကို ထုတ်ယူနိုင်ပါပြီ။" : "Unlocked: at least one successful sale has been delivered.")
                  : (myanmar ? "ပထမဆုံး ထုတ်ကုန်ရောင်းချမှု အောင်မြင်စွာ ပို့ဆောင်ပြီးမှသာ ဖိတ်ခေါ်ဆုကြေးများကို ထုတ်ယူနိုင်ပါမည်။" : "Locked until at least one product sale is successfully delivered.")
                : (myanmar ? "တစ်ဦးဦးကို သင့်ကုဒ်ဖြင့် မှတ်ပုံတင်ရန် ဖိတ်ခေါ်ပါ။" : "Invite someone with your code to earn a referral bonus.")}</p>
            </div>
            <div><p className="text-sm text-muted">{myanmar ? "သင့်ဖိတ်ခေါ်ကုဒ်" : "Your referral code"}</p><p className="mt-1 font-medium">{user.referralCode}</p><p className="mt-1 text-xs text-muted">{myanmar ? "ဖိတ်ခေါ်ထားသောဆိုင်တစ်ဆိုင် မှတ်ပုံတင်လျှင် ဆုကြေးရရှိပြီး၊ သင့်ဆိုင် အော်ဒါပို့ဆောင်ပြီးမှ ထုတ်ယူနိုင်ပါမည်။" : "Earn $30.00 (~ 135,000 MMK) for each referred store; your bonus unlocks after your store completes a delivered sale."}</p></div>
            <div><p className="text-sm text-muted">{myanmar ? "အသုံးပြုခဲ့သော ဖိတ်ခေါ်ကုဒ်" : "Invitation code used"}</p><p className="mt-1 font-medium">{user.invitationCode || "—"}</p></div>
            <div><p className="text-sm text-muted">{myanmar ? "စာရင်းသွင်းသည့်နေ့" : "Registered"}</p><p className="mt-1 font-medium">{new Date(user.createdAt).toLocaleDateString(language === "my" ? "my-MM" : "en-US")}</p></div>
          </div>
          <section className="rounded-xl bg-white p-6 shadow-soft">
            <div className="flex items-center gap-3"><Store className="text-leaf" /><div><p className="eyebrow">{myanmar ? "အခမဲ့စာရင်းသွင်းရန်" : "Free product listing"}</p><h2 className="mt-1 font-display text-2xl">{myanmar ? "သင့်ဆိုင်တွင် ကုန်ပစ္စည်းထည့်ပါ" : "List a product in your store"}</h2></div></div>
            <p className="mt-3 text-sm leading-6 text-muted">{myanmar ? "စာရင်းသွင်းခ သို့မဟုတ် ကြိုတင်ကုန်ပစ္စည်းကုန်ကျစရိတ် မရှိပါ။ အော်ဒါရောက်မှသာ ပစ္စည်းကုန်ကျစရိတ်ကို ဆောင်ရွက်ပြီး ပို့ဆောင်အောင်မြင်ပါက ကုန်ကျစရိတ်နှင့် အမြတ် ၁၀% ရရှိပါမည်။" : "There is no listing or upfront inventory charge. After an order is delivered, the store receives the product cost plus 10% sales profit."}</p>
            <form onSubmit={(event) => void handleListing(event)} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">{myanmar ? "ကုန်ပစ္စည်းအမည်" : "Product name"}
                <input name="name" required minLength={2} maxLength={120} className="form-input mt-2 w-full rounded-lg border-black/15" />
              </label>
              <label className="block text-sm">{myanmar ? "အမျိုးအစား" : "Category"}
                <select name="category" className="form-select mt-2 w-full rounded-lg border-black/15">{listingCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
              </label>
              <label className="block text-sm">{myanmar ? "ကုန်ကျစရိတ် (MMK)" : "Product cost (MMK)"}
                <input name="costPriceMMK" type="number" min="300000" max="1000000000" step="1" required className="form-input mt-2 w-full rounded-lg border-black/15" />
                <span className="mt-1 block text-xs text-muted">{myanmar ? "အနည်းဆုံး $66.67 (~ 300,000 MMK)" : "Minimum $66.67 (~ 300,000 MMK)"}</span>
              </label>
              <label className="block text-sm sm:col-span-2">{myanmar ? "အရည်အသွေးမြင့် ပုံ URL (HTTPS)" : "High-quality cover image URL (HTTPS)"}
                <input name="imageUrl" type="url" required placeholder="https://images.unsplash.com/..." className="form-input mt-2 w-full rounded-lg border-black/15" />
              </label>
              <label className="block text-sm sm:col-span-2">{myanmar ? "ဖော်ပြချက်" : "Description"}
                <textarea name="description" maxLength={1000} rows={3} className="form-textarea mt-2 w-full rounded-lg border-black/15" />
              </label>
              <p className="text-xs leading-5 text-muted sm:col-span-2">{myanmar ? "ဖော်ပြဈေးကို ကုန်ကျစရိတ်၏ ၁၁၀% အဖြစ် အလိုအလျောက်သတ်မှတ်မည်။ ပို့ဆောင်အောင်မြင်ပါက ဆိုင်၏ပိုက်ဆံအိတ်သို့ ကုန်ကျစရိတ်နှင့် ၁၀% အမြတ် ထည့်သွင်းမည်။" : "The displayed sale price is set at 110% of product cost; after successful delivery, the cost plus 10% profit is credited to your wallet."}</p>
              <button disabled={submitting} className="button-primary sm:col-span-2">{submitting ? (myanmar ? "တင်နေသည်…" : "Listing…") : (myanmar ? "အခမဲ့စာရင်းသွင်းရန်" : "List product for free")}</button>
            </form>
          </section>
        </section>
        <aside className="space-y-7">
          <section className="rounded-xl bg-white p-6 shadow-soft">
            <h2 className="font-display text-2xl">{myanmar ? "သင့်ကုန်ပစ္စည်းများ" : "Your listings"}</h2>
            <div className="mt-4 space-y-4">
              {myProducts.map((product) => <article key={product.id} className="flex gap-3 border-b border-black/10 pb-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-sand"><Image src={product.images[0]} alt={product.name} fill unoptimized sizes="64px" className="object-cover" /></div>
                <div><Link href={`/products/${product.slug}`} className="font-medium hover:text-leaf">{product.name}</Link><p className="mt-1 text-xs text-muted">{formatPricePair(product.price, "MMK")}</p><p className="mt-1 text-xs text-muted">{product.category}</p></div>
              </article>)}
              {myProducts.length === 0 && <p className="text-sm text-muted">{myanmar ? "ကုန်ပစ္စည်းစာရင်း မရှိသေးပါ။" : "You have not listed any products yet."}</p>}
            </div>
          </section>
          <section className="rounded-xl bg-white p-6 shadow-soft">
            <h2 className="font-display text-2xl">{myanmar ? "အကူအညီတောင်းရန်" : "Contact customer service"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{myanmar ? "သင့်တောင်းဆိုချက်ကို ဝန်ဆောင်မှုအဖွဲ့က ကြည့်ရှုပြီး ဖြေရှင်းပေးမည်။" : "Send an issue to the support team for review and resolution."}</p>
            <form onSubmit={(event) => void handleSupport(event)} className="mt-4 space-y-3">
              <textarea name="message" required minLength={5} maxLength={1000} rows={4} placeholder={myanmar ? "သင့်မေးခွန်း သို့မဟုတ် ပြဿနာကို ရေးပါ…" : "Describe your question or issue…"} className="form-textarea w-full rounded-lg border-black/15 text-sm" />
              <button className="button-secondary w-full">{myanmar ? "အကူအညီတောင်းဆိုရန်" : "Submit support request"}</button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
