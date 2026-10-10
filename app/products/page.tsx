import { ProductCatalog } from "@/components/ProductCatalog";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  return (
    <ProductCatalog
      initialCategory={params.category ?? "All"}
      initialQuery={params.q ?? ""}
    />
  );
}
