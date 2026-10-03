import { readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { sounds } from "@/data/sounds";
import { stories } from "@/data/stories";
import { pageMetadata, site } from "@/config/site";

const files = [
  "01-why-rain-sounds-help-you-sleep.md",
  "02-brown-noise-vs-white-noise-vs-pink-noise.md",
  "03-bedtime-stories-for-adults.md",
  "04-asmr-for-sleep.md",
] as const;

export type BlogBlock = {
  kind: "h2" | "h3" | "paragraph" | "ul" | "ol" | "quote";
  text: string;
  items?: string[];
};
export type BlogPost = {
  title: string;
  slug: string;
  metaTitle: string;
  description: string;
  cta: string;
  links: { label: string; href: string }[];
  ctaHref: string;
  relatedSlug: string;
  blocks: BlogBlock[];
};

// Deliberately supports the supplied Markdown subset; raw HTML is never executed.
function parseBlocks(body: string): BlogBlock[] {
  const lines = body.trim().split("\n");
  const blocks: BlogBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || line.startsWith("# ")) {
      index++;
      continue;
    }
    const heading = /^(#{2,3}) (.+)$/.exec(line);
    if (heading) {
      blocks.push({ kind: heading[1].length === 2 ? "h2" : "h3", text: heading[2] });
      index++;
      continue;
    }
    const list = /^(?:- |\d+\. )/.exec(line);
    if (list) {
      const ordered = /^\d/.test(line);
      const pattern = ordered ? /^\d+\. / : /^- /;
      const items: string[] = [];
      while (index < lines.length && pattern.test(lines[index]))
        items.push(lines[index++].replace(pattern, ""));
      blocks.push({ kind: ordered ? "ol" : "ul", text: items.join(" "), items });
      continue;
    }
    const quote = line.startsWith("> ");
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() &&
      !/^(?:#{1,3} |[-] |\d+\. )/.test(lines[index])) {
      paragraph.push(quote ? lines[index].replace(/^> ?/, "") : lines[index]);
      index++;
    }
    blocks.push({ kind: quote ? "quote" : "paragraph", text: paragraph.join("\n") });
  }
  return blocks;
}

const soundLinks: Record<string, string> = {
  "Rain Sounds for Sleeping": "rain",
  "Rain on Window": "rain-window",
  "Thunderstorm Sounds": "thunder",
  "White Noise for Sleep": "white-noise",
  "Pink Noise for Sleep": "pink-noise",
  "Brown Noise for Sleep": "brown-noise",
  "Forest Sounds at Night": "forest",
  "Fireplace Sounds": "fireplace",
};

export const getBlogPosts = cache((): BlogPost[] => {
  const posts = files.map((file) => {
    const source = readFileSync(path.join(process.cwd(), "src/content/blog", file), "utf8")
      .replace(/\r\n/g, "\n");
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
    if (!match) throw new Error(`Missing blog front matter: ${file}`);
    const fields: Record<string, string | string[]> = {};
    let listKey = "";
    for (const line of match[1].split("\n")) {
      const scalar = /^(\w+):\s*(.*)$/.exec(line);
      if (scalar) {
        listKey = scalar[1];
        fields[listKey] = scalar[2] ? JSON.parse(scalar[2]) : [];
      } else if (line.startsWith("  - ") && Array.isArray(fields[listKey])) {
        (fields[listKey] as string[]).push(JSON.parse(line.slice(4)));
      }
    }
    function field(key: string) {
      const value = fields[key];
      if (typeof value !== "string" || !value) throw new Error(`Missing ${key}: ${file}`);
      return value;
    }
    const suggestions = fields.suggested_internal_links;
    if (!Array.isArray(suggestions)) throw new Error(`Missing internal links: ${file}`);
    const links = suggestions.map((label) => {
      const sound = sounds.find((item) => item.id === soundLinks[label]);
      if (sound) return {
        label: label === "Thunderstorm Sounds" ? "Distant Thunder Sounds" : label,
        href: `/sounds/${sound.slug}`,
      };
      const story = stories.find((item) => item.title === label);
      if (story) return { label, href: `/stories/${story.slug}` };
      throw new Error(`Unresolved blog link: ${label}`);
    });
    return {
      title: field("title"), slug: field("slug"), metaTitle: field("meta_title"),
      description: field("meta_description"), cta: field("suggested_cta"),
      links, ctaHref: file.startsWith("02-") ? "/sounds" :
        file.startsWith("03-") || file.startsWith("04-") ? "/stories" : links[0].href,
      relatedSlug: "", blocks: parseBlocks(match[2]),
    };
  });
  const pairs = [1, 0, 3, 2];
  return posts.map((post, index) => ({ ...post, relatedSlug: posts[pairs[index]].slug }));
});

export function blogMetadata(post: BlogPost) {
  const metadata = pageMetadata(post.metaTitle, post.description, `/blog/${post.slug}`);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article" as const } };
}

export function plainBlogText(text: string) {
  return text.replace(/\*\*([^*]+)\*\*|\*([^*]+)\*/g, "$1$2")
    .replace(/\s+/g, " ").trim();
}

export function blogStructuredData(post: BlogPost) {
  const faq: { question: string; answer: string }[] = [];
  let inFaq = false;
  for (const block of post.blocks) {
    if (block.kind === "h2") inFaq = block.text === "Frequently asked questions";
    else if (inFaq && block.kind === "h3") faq.push({ question: block.text, answer: "" });
    else if (inFaq && block.kind === "paragraph" && faq.length)
      faq[faq.length - 1].answer += `${faq[faq.length - 1].answer ? " " : ""}${plainBlogText(block.text)}`;
  }
  const url = `${site.url}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting", headline: post.title, description: post.description,
        url, mainEntityOfPage: { "@type": "WebPage", "@id": url }, inLanguage: "en",
        publisher: { "@type": "Organization", name: site.name, url: site.url },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Home", url: site.url },
          { name: "Blog", url: `${site.url}/blog` },
          { name: post.title, url },
        ].map((item, index) => ({
          "@type": "ListItem", position: index + 1, name: item.name, item: item.url,
        })),
      },
      ...(faq.length ? [{
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question", name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }] : []),
    ],
  };
}
