import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-wrap py-24 text-center">
      <p className="eyebrow">Well, this is a little awkward</p>
      <h1 className="mt-3 font-display text-4xl">We couldn’t find that page.</h1>
      <p className="mt-4 text-sm text-muted">It may have moved, or perhaps it never existed.</p>
      <Link href="/products" className="button-primary mt-7">Browse the collection</Link>
    </div>
  );
}
