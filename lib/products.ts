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
  { name: "Home", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85" },
  { name: "Kitchen", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85" },
  { name: "Wellness", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85" },
  { name: "Accessories", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85" },
];

export const productCategories = [
  "Women's Fashion",
  "Bags & Purses",
  "Accessories",
  "Beauty & Cosmetics",
  "Skincare",
  "Jewelry & Accessories",
  "Shoes",
  "Loungewear",
  "Haircare",
  "Activewear",
  "Lifestyle",
  "Wellness",
  "Home",
  "Kitchen",
  "Technology",
  "Stationery",
  "Travel",
  "Pets",
];
