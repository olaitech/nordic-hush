import type { Story } from "@/types/story";

export function StorySource({ story }: { story: Story }) {
  const source = story.source;
  if (
    !source ||
    !(source.label || source.url || source.note || source.publicDomain === true)
  )
    return null;
  return (
    <section className="sound-about">
      <h2>Source</h2>
      {source.publicDomain === true && <p>Public domain</p>}
      {(source.label || source.url) && (
        <p>
          {source.url ? (
            <a
              className="back-link"
              href={source.url}
              rel="external noreferrer"
            >
              {source.label || "Original source"} ↗
            </a>
          ) : (
            source.label
          )}
        </p>
      )}
      {source.note && <p>{source.note}</p>}
    </section>
  );
}
