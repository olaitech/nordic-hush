export type AffiliateCategory =
  | "sleep-headphones"
  | "sleep-masks"
  | "bedside-audio"
  | "pillow-speakers"
  | "bedtime-accessories";

export type AffiliateProduct = {
  id: string;
  name: string;
  slug: string;
  merchant: "ebay";
  affiliateUrl: string;
  imageSrc?: string;
  shortDescription: string;
  longDescription?: string;
  category: AffiliateCategory;
  recommendedFor?: string[];
  badge?: string;
  featured?: boolean;
  active: boolean;
};
