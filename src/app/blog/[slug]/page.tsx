import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { AffiliateCallout } from "@/components/affiliate/AffiliateCallout";
import { JsonLd } from "@/components/JsonLd";
import { blogMetadata, blogStructuredData, getBlogPosts } from "@/lib/blog";

const sleepGearCallouts = {
  "why-rain-sounds-help-you-sleep": {
    category: "bedside-audio",
    title: "Prefer a dedicated bedside sound machine?",
    description: "A small sound machine can be useful when you want steady background audio without using your phone.",
    cta: "Explore bedside audio",
  },
  "brown-noise-vs-white-noise-vs-pink-noise-for-sleep": {
    category: "bedside-audio",
    title: "Want noise without using your phone?",
    description: "A dedicated bedside sound machine can provide a simple, consistent nighttime sound source.",
    cta: "Explore bedside audio",
  },
  "why-bedtime-stories-work-for-adults": {
    category: "sleep-headphones",
    title: "Listening in bed?",
    description: "Soft sleep headphones can make bedtime stories more comfortable than regular earbuds.",
    cta: "Explore sleep headphones",
  },
  "asmr-for-sleep-soft-sounds-slow-voices": {
    category: "sleep-headphones",
    title: "Listening to ASMR in bed?",
    description: "Soft sleep headphones can be a more comfortable option for quiet nighttime listening.",
    cta: "Explore sleep headphones",
  },
} as const;

export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getBlogPosts()).map((post) => ({ slug: post.slug }));
}
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = (await getBlogPosts()).find((item) => item.slug === slug);
  if (!post) notFound();
  return blogMetadata(post);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const posts = await getBlogPosts();
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();
  const callout = sleepGearCallouts[post.slug as keyof typeof sleepGearCallouts];
  const related = posts.find((item) => item.slug === post.relatedSlug)!;
  return (
    <main id="main-content" className="main-container prose-page blog-page">
      <JsonLd data={blogStructuredData(post)} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/blog">Blog</Link></li>
          <li><span aria-current="page">{post.title}</span></li>
        </ol>
      </nav>
      <span className="eyebrow">NORDIC HUSH BLOG</span>
      <h1>{post.title}</h1>
      <BlogArticle post={post} related={related} />
      {callout && <AffiliateCallout {...callout} />}
      <Link className="back-link" href="/blog">All articles →</Link>
    </main>
  );
}
