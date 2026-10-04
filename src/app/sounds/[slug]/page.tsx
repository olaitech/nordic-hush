import Link from "next/link";
import { notFound } from "next/navigation";
import { sounds, type SoundId } from "@/data/sounds";
import { pageMetadata, site } from "@/config/site";
import { JsonLd } from "@/components/JsonLd";
import { SoundCard } from "@/components/SoundLibrary";
import { Mixer } from "@/components/Mixer";
import { SleepTimer } from "@/components/SleepTimer";
import { getBlogPosts } from "@/lib/blog";
import { AffiliateCallout } from "@/components/affiliate/AffiliateCallout";

export const dynamicParams = false;
export function generateStaticParams() {
  return sounds.map((sound) => ({ slug: sound.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const sound = sounds.find((sound) => sound.slug === slug);
  if (!sound) notFound();
  return pageMetadata(
    `${sound.seoTitle} | ${site.name}`,
    sound.seoDescription,
    `/sounds/${sound.slug}`,
  );
}

export default async function SoundPage({ params }: Props) {
  const { slug } = await params;
  const sound = sounds.find((sound) => sound.slug === slug);
  if (!sound) notFound();
  const related = sound.relatedSoundIds.map((id: SoundId) =>
    sounds.find((item) => item.id === id)!,
  );
  const reading = getBlogPosts().filter((post) =>
    post.links.some((link) => link.href === `/sounds/${sound.slug}`),
  );
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Sounds", path: "/sounds" },
    { name: sound.h1, path: `/sounds/${sound.slug}` },
  ];
  return (
    <main id="main-content" className="main-container detail-page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: `${site.url}${crumb.path}`,
          })),
        }}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.path}>
              {index === breadcrumbs.length - 1 ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <Link href={crumb.path}>{crumb.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="detail-intro">
        <span className="eyebrow">YOUR LITTLE ESCAPE</span>
        <h1>{sound.h1}</h1>
        <p>{sound.intro}</p>
      </div>
      <div className="single-sound">
        <SoundCard sound={sound} />
      </div>
      <Mixer />
      <SleepTimer />
      <Link className="back-link" href="/sounds">
        Add more sounds from the library →
      </Link>
      <section className="sound-about">
        <h2>About this sound</h2>
        {sound.longDescription.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
      <section className="related">
        <h2>Try it with</h2>
        <ul className="related-links">
          {related.map((item) => (
            <li key={item.id}>
              <Link href={`/sounds/${item.slug}`}>{item.h1}</Link>
            </li>
          ))}
        </ul>
        <div className="sound-grid">
          {related.map((item) => (
            <SoundCard key={item.id} sound={item} />
          ))}
        </div>
        {reading.length > 0 && (
          <p>
            For a little bedtime reading:{" "}
            {reading.map((post, index) => (
              <span key={post.slug}>
                {index > 0 && " · "}
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </span>
            ))}
          </p>
        )}
      </section>
      <section className="sound-uses">
        <h2>Common uses</h2>
        <ul>
          {sound.useCases.map((use) => (
            <li key={use}>{use}</li>
          ))}
        </ul>
      </section>
      {sound.id === "rain" && <AffiliateCallout category="bedside-audio" title="Prefer a dedicated bedside sound machine?" description="Some listeners prefer a dedicated sound machine for ambient bedtime listening without using their phone." cta="Explore bedside audio" />}
      <section className="faq">
        <h2>Frequently asked questions</h2>
        {sound.faq.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </main>
  );
}
