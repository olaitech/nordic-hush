import { sounds, type SoundId } from "@/data/sounds";
import { SoundCard } from "@/components/SoundLibrary";

export function StoryAtmosphere({ soundIds = [] }: { soundIds?: SoundId[] }) {
  const recommended = sounds.filter((sound) => soundIds.includes(sound.id));
  if (!recommended.length) return null;
  return (
    <section
      className="related story-atmosphere"
      aria-labelledby="atmosphere-heading"
    >
      <h2 id="atmosphere-heading">Add some atmosphere</h2>
      <div className="sound-grid">
        {recommended.map((sound) => (
          <SoundCard key={sound.id} sound={sound} />
        ))}
      </div>
    </section>
  );
}
