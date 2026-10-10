import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPricePair, getProductCurrency } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-sand">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          unoptimized={Boolean(product.sellerId)}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-forest">
            {product.badge}
          </span>
        )}
      </Link>
      <div className="flex items-start justify-between gap-2 pt-3">
        <div>
          <Link href={`/products/${product.slug}`} className="font-medium hover:text-leaf">{product.name}</Link>
          <p className="mt-1 text-sm text-muted">{product.category}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted">
            <Star size={13} className="fill-amber-500 text-amber-500" /> {product.rating} <span>({product.reviewCount})</span>
          </p>
        </div>
        <div className="shrink-0 pt-0.5 text-right text-xs font-medium">
          <span>{formatPricePair(product.price, getProductCurrency(product))}</span>
          {product.compareAtPrice && <span className="mt-1 block text-xs text-muted line-through">{formatPricePair(product.compareAtPrice, getProductCurrency(product))}</span>}
        </div>
      </div>
    </article>
  );
}
