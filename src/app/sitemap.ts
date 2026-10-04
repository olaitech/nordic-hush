import type { MetadataRoute } from "next";
import { sounds } from "@/data/sounds";
import { site } from "@/config/site";
import { storyPaths } from "@/data/stories";
import { getBlogPosts } from "@/lib/blog";
import { hasAffiliateProducts } from "@/data/affiliate-products";
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getBlogPosts();
  return [
    "/",
    "/sounds",
    "/about",
    "/privacy",
    "/faq",
    ...sounds.map((sound) => `/sounds/${sound.slug}`),
    ...storyPaths(),
    "/blog",
    ...(hasAffiliateProducts() ? ["/sleep-gear"] : []),
    ...posts.map((post) => `/blog/${post.slug}`),
  ].map((path) => ({
    url: `${site.url}${path}`,
  }));
}
