import productData from "@/data/products.json";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  badge: string;
  description: string;
  details: string[];
  images: string[];
  sellerId?: string;
  costPrice?: number;
  currency?: "USD" | "MMK";
};

export const products = productData as Product[];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const categories = [
  { name: "Men's Clothing", image: products.find((product) => product.category === "Men's Clothing")?.images[0] ?? "" },
  { name: "Women's Clothing", image: products.find((product) => product.category === "Women's Clothing")?.images[0] ?? "" },
  { name: "Home Appliances", image: products.find((product) => product.category === "Home Appliances")?.images[0] ?? "" },
  { name: "Kitchenware", image: products.find((product) => product.category === "Kitchenware")?.images[0] ?? "" },
  { name: "Building Materials", image: products.find((product) => product.category === "Building Materials")?.images[0] ?? "" },
];

export const productCategories = [
  "Men's Clothing",
  "Women's Clothing",
  "Home Appliances",
  "Kitchenware",
  "Building Materials",
];
