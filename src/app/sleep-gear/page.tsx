import { pageMetadata } from "@/config/site";
import { affiliateCategories, getActiveAffiliateProducts, hasAffiliateProducts } from "@/data/affiliate-products";
import { ProductCard } from "@/components/affiliate/ProductCard";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";

export const metadata = {
  ...pageMetadata(
    "Sleep Gear for Better Bedtime Listening | Nordic Hush",
    "Explore a small collection of sleep headphones, masks and bedside audio products selected to complement Nordic Hush sounds and bedtime stories.",
    "/sleep-gear",
  ),
  robots: { index: hasAffiliateProducts(), follow: true },
};

export default function SleepGearPage() {
  const products = getActiveAffiliateProducts();
  return (
    <main id="main-content" className="main-container sleep-gear-page">
      <div className="detail-intro">
        <span className="eyebrow">A LITTLE MORE COMFORT</span>
        <h1>Sleep Gear</h1>
        <p>A small collection of things that can make listening, resting and winding down a little more comfortable.</p>
      </div>
      <AffiliateDisclosure />
      {products.length === 0 && <p className="affiliate-empty">Recommendations are being prepared.</p>}
      {affiliateCategories.map((category) => {
        const items = products.filter((product) => product.category === category.id)
          .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
        // Keep deep-link targets available without displaying empty categories.
        if (!items.length) return <span key={category.id} id={category.id} className="affiliate-anchor" aria-hidden="true" />;
        return (
          <section key={category.id} id={category.id} className="affiliate-category" aria-labelledby={`${category.id}-title`}>
            <h2 id={`${category.id}-title`}>{category.name}</h2>
            <div className="affiliate-grid">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </section>
        );
      })}
    </main>
  );
}
