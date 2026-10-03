import type { MetadataRoute } from "next";
import { sounds } from "@/data/sounds";
import { site } from "@/config/site";
import { storyPaths } from "@/data/stories";
import { getBlogPosts } from "@/lib/blog";
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getBlogPosts();
  return [
    "/",
    "/sounds",
    "/about",
    "/privacy",
    ...sounds.map((sound) => `/sounds/${sound.slug}`),
    ...storyPaths(),
    "/blog",
    ...posts.map((post) => `/blog/${post.slug}`),
  ].map((path) => ({
    url: `${site.url}${path}`,
  }));
}
