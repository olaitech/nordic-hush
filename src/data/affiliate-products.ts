import type { AffiliateCategory, AffiliateProduct } from "@/types/affiliate";

export const affiliateCategories: { id: AffiliateCategory; name: string }[] = [
  { id: "sleep-headphones", name: "Sleep Headphones" },
  { id: "bedside-audio", name: "Bedside Audio" },
  { id: "sleep-masks", name: "Sleep Masks" },
  { id: "pillow-speakers", name: "Pillow Speakers" },
  { id: "bedtime-accessories", name: "Bedtime Accessories" },
];

// Add approved recommendations here, then rebuild/deploy to publish them.
// Paste final eBay Partner Network URLs unchanged. Keep drafts active: false.
// Optional local images: /products/<product-slug>/product.webp (under public/).
// Use unique ids/slugs. Catalog order follows editorial priority.
export const affiliateProducts: AffiliateProduct[] = [
  {
    // eBay item ID: 327230489553; EPN Custom ID: SleepHeadphones
    id: "sleep-headphones",
    name: "Sleep Headphones",
    slug: "sleep-headphones",
    merchant: "ebay",
    affiliateUrl: "https://ebay.us/tbJRg4",
    category: "sleep-headphones",
    shortDescription: "Soft headphones designed for comfortable bedtime listening without using regular earbuds.",
    longDescription: "A comfortable option for listening to Nordic Hush sleep stories, rain sounds and ASMR while resting in bed.",
    recommendedFor: ["Sleep stories", "ASMR", "Rain sounds", "Bedtime listening"],
    badge: "Popular for Stories & ASMR",
    featured: true,
    active: true,
  },
  {
    // eBay item ID: 404635472830; EPN Custom ID: WhiteNoiseSoundMachine
    id: "white-noise-sound-machine",
    name: "White Noise Sound Machine",
    slug: "white-noise-sound-machine",
    merchant: "ebay",
    affiliateUrl: "https://ebay.us/EeffWn",
    category: "bedside-audio",
    shortDescription: "A dedicated bedside sound machine for people who prefer sleep sounds without using their phone.",
    longDescription: "A bedside audio option for creating a consistent nighttime sound environment alongside a simple sleep routine.",
    recommendedFor: ["White noise", "Bedside audio", "Sleep routines", "Phone-free listening"],
    badge: "Bedside Pick",
    featured: true,
    active: true,
  },
  {
    // eBay item ID: 406220681286; EPN Custom ID: SleepEyeMask
    id: "sleep-eye-mask",
    name: "Sleep Eye Mask",
    slug: "sleep-eye-mask",
    merchant: "ebay",
    affiliateUrl: "https://ebay.us/M9RGyw",
    category: "sleep-masks",
    shortDescription: "A simple sleep mask for creating a darker and calmer bedtime environment.",
    longDescription: "An easy addition to a nighttime routine for people who prefer less light while resting, travelling or listening to sleep audio.",
    recommendedFor: ["Darker rooms", "Bedtime stories", "Travel", "Relaxation"],
    badge: "Simple Sleep Essential",
    featured: false,
    active: true,
  },
  {
    // eBay item ID: 920007479912; EPN Custom ID: Quiet2EarPlugs
    id: "loop-quiet-2-earplugs",
    name: "Loop Quiet 2 Earplugs",
    slug: "loop-quiet-2-earplugs",
    merchant: "ebay",
    affiliateUrl: "https://ebay.us/QMBMLJ",
    category: "bedtime-accessories",
    shortDescription: "Reusable earplugs for people who prefer a quieter environment when winding down or sleeping.",
    longDescription: "A simple option for listeners who sometimes prefer reducing outside noise rather than adding ambient sound.",
    recommendedFor: ["Quiet sleep", "Travel", "Nighttime routines", "Noise reduction"],
    badge: "For Quiet Sleep",
    featured: false,
    active: true,
  },
  {
    // eBay item ID: 820135168881; EPN Custom ID: nasalstrips
    id: "nasal-strips",
    name: "Nasal Strips",
    slug: "nasal-strips",
    merchant: "ebay",
    affiliateUrl: "https://ebay.us/1rx30C",
    category: "bedtime-accessories",
    shortDescription: "A simple nighttime accessory some people include as part of their bedtime routine.",
    longDescription: "A lightweight bedtime accessory for people looking to build a simple and comfortable nighttime routine.",
    recommendedFor: ["Bedtime routines", "Travel", "Nighttime comfort"],
    badge: "Bedtime Accessory",
    featured: false,
    active: true,
  }
];

export function getActiveAffiliateProducts(
  catalog: readonly AffiliateProduct[] = affiliateProducts,
) {
  return catalog.filter((product) => product.active);
}

export function hasAffiliateProducts() {
  return getActiveAffiliateProducts().length > 0;
}
