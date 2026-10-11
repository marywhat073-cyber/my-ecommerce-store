import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Service Portal",
  robots: { index: false, follow: false },
};

export default function CustomerServiceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
