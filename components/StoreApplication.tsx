"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { CustomerService } from "@/components/CustomerService";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function StoreApplication({ children }: { children: ReactNode }) {
  const { user, hydrated, hydrationError } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const isServicePortal = pathname === "/admin-cs-dashboard";

  useEffect(() => {
    if (hydrated && !user && pathname !== "/" && !isServicePortal) router.replace("/");
  }, [hydrated, user, pathname, isServicePortal, router]);

  if (isServicePortal) return <main className="min-h-screen">{children}</main>;
  if (!hydrated) return <main className="page-wrap py-24 text-center text-sm text-muted">Loading store account…</main>;
  if (hydrationError) return <main className="page-wrap py-24"><p role="alert" className="mx-auto max-w-xl rounded-lg bg-red-50 p-4 text-sm text-red-800">Store data could not be loaded. Please refresh or contact customer service.</p></main>;
  if (!user && pathname !== "/") return null;
  if (!user) return <main className="min-h-screen">{children}</main>;

  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
      <CustomerService />
    </>
  );
}
