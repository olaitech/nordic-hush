import type { NextConfig } from "next";
import { sounds } from "./src/data/sounds";

const nextConfig: NextConfig = {
  devIndicators: false,
  redirects() {
    return sounds.flatMap((sound) =>
      sound.legacySlugs.map((slug) => ({
        source: `/sounds/${slug}`,
        destination: `/sounds/${sound.slug}`,
        permanent: true,
      })),
    );
  },
};

export default nextConfig;
