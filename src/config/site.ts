import type { Metadata } from "next";

// Public SEO always identifies production, including builds on preview hosts.
export const site = {
  name: "Nordic Hush",
  url: "https://nordic-hush.com",
  title: "Nordic Hush — Sounds for Sleep, Focus & Calm",
  description:
    "Create your own calming sound mix with rain, ocean waves, fireplace, nature sounds, brown noise, white noise and more. Free to play.",
  socialImage: "/opengraph-image",
};

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: site.socialImage,
          width: 1200,
          height: 630,
          alt: "Nordic Hush. Find your quiet.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [site.socialImage],
    },
  };
}
