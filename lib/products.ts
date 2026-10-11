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
export const MINIMUM_PRODUCT_PRICE_MMK = 300_000;

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const categories = [
  { name: "Tech, Phones & Computers", image: products.find((product) => product.category === "Tech, Phones & Computers")?.images[0] ?? "" },
  { name: "Men's Fashion & Grooming", image: products.find((product) => product.category === "Men's Fashion & Grooming")?.images[0] ?? "" },
  { name: "Women's Fashion, Clothing & Lingerie", image: products.find((product) => product.category === "Women's Fashion, Clothing & Lingerie")?.images[0] ?? "" },
  { name: "Women's Makeup & Cosmetics", image: products.find((product) => product.category === "Women's Makeup & Cosmetics")?.images[0] ?? "" },
  { name: "Skincare & Haircare", image: products.find((product) => product.category === "Skincare & Haircare")?.images[0] ?? "" },
  { name: "Kitchen Appliances & Utensils", image: products.find((product) => product.category === "Kitchen Appliances & Utensils")?.images[0] ?? "" },
  { name: "Home Cleaning, Decor & Building Materials", image: products.find((product) => product.category === "Home Cleaning, Decor & Building Materials")?.images[0] ?? "" },
];

export const productCategories = [
  ...categories.map((category) => category.name),
];
