import Link from "next/link";
import type { AffiliateCategory } from "@/types/affiliate";

export function AffiliateCallout({
  category = "sleep-headphones",
  eyebrow,
  title = "Listening in bed?",
  description = "Soft sleep headphones can make bedtime listening more comfortable than regular earbuds.",
  cta = "Explore sleep headphones",
}: { category?: AffiliateCategory | null; eyebrow?: string; title?: string; description?: string; cta?: string }) {
  return (
    <aside className="affiliate-callout" aria-label={title}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="text-button" href={category ? `/sleep-gear#${category}` : "/sleep-gear"}>{cta} →</Link>
    </aside>
  );
}
