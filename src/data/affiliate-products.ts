import type { AffiliateCategory, AffiliateProduct } from "@/types/affiliate";

export const affiliateCategories: { id: AffiliateCategory; name: string }[] = [
  { id: "sleep-headphones", name: "Sleep Headphones" },
  { id: "sleep-masks", name: "Sleep Masks" },
  { id: "bedside-audio", name: "Bedside Audio" },
  { id: "pillow-speakers", name: "Pillow Speakers" },
  { id: "bedtime-accessories", name: "Bedtime Accessories" },
];

// Add approved recommendations here, then rebuild/deploy to publish them.
// Paste final eBay Partner Network URLs unchanged. Keep drafts active: false.
// Optional local images: /products/<product-slug>/product.webp (under public/).
// Use unique ids/slugs. No products or affiliate URLs are supplied yet.
export const affiliateProducts: AffiliateProduct[] = [];

export function getActiveAffiliateProducts(
  catalog: readonly AffiliateProduct[] = affiliateProducts,
) {
  return catalog.filter((product) => product.active);
}

export function hasAffiliateProducts() {
  return getActiveAffiliateProducts().length > 0;
}
