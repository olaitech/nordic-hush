import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { AffiliateCallout } from "@/components/affiliate/AffiliateCallout";
import { JsonLd } from "@/components/JsonLd";
import { blogMetadata, blogStructuredData, getBlogPosts } from "@/lib/blog";

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
      {["asmr-for-sleep-soft-sounds-slow-voices", "why-bedtime-stories-work-for-adults"].includes(post.slug) && <AffiliateCallout />}
      <Link className="back-link" href="/blog">All articles →</Link>
    </main>
  );
}
