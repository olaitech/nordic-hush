import type { MetadataRoute } from "next";
import { sounds } from "@/data/sounds";
import { site } from "@/config/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/sounds",
    "/about",
    "/privacy",
    ...sounds.map((sound) => `/sounds/${sound.slug}`),
  ].map((path) => ({
    url: `${site.url}${path}`,
  }));
}
