export function StoryTranscript({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <section className="story-transcript sound-about" aria-label="Transcript">
      <details>
        <summary>Read transcript</summary>
        <div>
          {text.split(/\r?\n\s*\r?\n/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </details>
    </section>
  );
}
