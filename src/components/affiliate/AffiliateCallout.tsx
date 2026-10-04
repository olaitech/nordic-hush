import Link from "next/link";
import type { AffiliateCategory } from "@/types/affiliate";

export function AffiliateCallout({
  category = "sleep-headphones",
  title = "Listening in bed?",
  description = "Some listeners prefer soft sleep headphones instead of regular earbuds.",
  cta = "Explore sleep headphones",
}: { category?: AffiliateCategory; title?: string; description?: string; cta?: string }) {
  return (
    <aside className="affiliate-callout" aria-label={title}>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="text-button" href={`/sleep-gear#${category}`}>{cta} →</Link>
    </aside>
  );
}
