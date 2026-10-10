import type { Metadata } from "next";
import { getProductBySlug, products } from "@/lib/products";
import { SellerProductPage } from "@/components/SellerProductPage";
import { ProductDetails } from "./ProductDetails";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return <SellerProductPage />;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);

  return <ProductDetails product={product} related={related} />;
}
