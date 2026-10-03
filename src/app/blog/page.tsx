import Link from "next/link";
import { pageMetadata } from "@/config/site";
import { getBlogPosts } from "@/lib/blog";

export const metadata = pageMetadata(
  "Blog | Nordic Hush", "Explore rain sounds, noise colors, bedtime stories and ASMR for quieter evenings.", "/blog",
);

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return (
    <main id="main-content" className="main-container detail-page">
      <div className="detail-intro">
        <span className="eyebrow">NORDIC HUSH BLOG</span>
        <h1>A little reading for quieter nights.</h1>
      </div>
      <div className="story-grid">
        {posts.map((post) => (
          <article className="sound-card story-card" key={post.slug}>
            <Link href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
              <p>{post.description}</p>
              <span className="story-listen">Read →</span>
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
