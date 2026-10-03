import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { BlogBlock, BlogPost } from "@/lib/blog";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s]+| {2}\n)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (/^https?:\/\//.test(part))
      return <a key={index} href={part}>{part}</a>;
    if (/^ {2}\n$/.test(part)) return <br key={index} />;
    return part;
  });
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.kind) {
    case "h2": return <h2>{inline(block.text)}</h2>;
    case "h3": return <h3>{inline(block.text)}</h3>;
    case "quote": return <blockquote><p>{inline(block.text)}</p></blockquote>;
    case "ul": return <ul>{block.items?.map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>;
    case "ol": return <ol>{block.items?.map((item, index) => <li key={index}>{inline(item)}</li>)}</ol>;
    default: return <p>{inline(block.text)}</p>;
  }
}

export function BlogArticle({ post, related }: { post: BlogPost; related: BlogPost }) {
  const faqIndex = post.blocks.findIndex((block) => block.kind === "h2" && block.text === "Frequently asked questions");
  // Place the supplied primary CTA after at least 30% of the main article copy,
  // at a section boundary so it never splits a paragraph or list.
  const mainBlocks = post.blocks.slice(0, faqIndex);
  const total = mainBlocks.reduce((sum, block) => sum + block.text.length, 0);
  let consumed = 0;
  const ctaIndex = mainBlocks.findIndex((block) => {
    if (block.kind === "h2" && consumed >= total * 0.3) return true;
    consumed += block.text.length;
    return false;
  });
  return (
    <article className="blog-copy">
      {post.blocks.map((block, index) => (
        <Fragment key={index}>
          {index === ctaIndex && (
            <aside className="blog-cta" aria-label="Related listening">
              <Link className="text-button" href={post.ctaHref}>{post.cta} →</Link>
              <ul>{post.links.map((link) => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
            </aside>
          )}
          {index === faqIndex && (
            <aside className="blog-next" aria-label="Keep exploring">
              <p><Link href={post.ctaHref}>{post.cta} →</Link></p>
              <p><Link href={`/blog/${related.slug}`}>{related.title} →</Link></p>
            </aside>
          )}
          <Block block={block} />
        </Fragment>
      ))}
    </article>
  );
}
