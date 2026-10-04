import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata } from "@/config/site";

export const metadata = pageMetadata(
  "Frequently Asked Questions | Nordic Hush",
  "Find answers about Nordic Hush sounds, sleep stories, mixing, mobile playback and the sleep timer. Get to know a quieter space for relaxation and everyday rest.",
  "/faq",
);

const questions = [
  {
    question: "What is Nordic Hush?",
    answer: "Nordic Hush is a collection of calming ambient sounds and slow narrated stories for sleep, focus and quiet moments. Choose a sound or story and listen at your own pace.",
  },
  {
    question: "Is Nordic Hush free to use?",
    answer: "Yes. The current sounds and sleep stories are free to listen to, with no account or subscription required.",
  },
  {
    question: "What sounds can I listen to?",
    answer: "The sound library includes rain, rain on a window, ocean waves, a flowing stream, forest ambience, fireplace crackles, distant thunder, gentle wind, winter storm, and white, pink and brown noise.",
  },
  {
    question: "What are sleep stories?",
    answer: "Sleep stories are slow narrated stories designed for quiet listening at bedtime. You can listen to a story on its own or add ambient sounds in the background.",
  },
  {
    question: "Can Nordic Hush keep playing when my phone screen is locked?",
    answer: "Playback can continue with the screen locked on supported mobile browsers after you press play. Your browser, phone settings and battery-saving mode may interrupt it, so try a short session on your device first.",
  },
  {
    question: "Can I mix several sleep sounds together?",
    answer: "Yes. You can combine up to six ambient sound layers and adjust each volume separately. You can also listen to one sleep story alongside your ambient mix.",
  },
  {
    question: "Is there a sleep timer?",
    answer: "Yes. Choose 15, 30, 60 or 120 minutes, or leave playback continuous. The timer starts when you press play and gently fades the whole mix during the final 30 seconds.",
  },
  {
    question: "Which noise is best for sleep: white, pink or brown noise?",
    answer: "There is no single best noise for everyone. White noise has a brighter hiss, pink noise sounds softer, and brown noise has a deeper rumble. Try each at a comfortable low volume and choose what feels most restful to you.",
  },
  {
    question: "Does Nordic Hush treat insomnia?",
    answer: "No. Nordic Hush is designed for relaxation and general wellness and is not a substitute for medical care. It does not diagnose, treat or cure insomnia or another medical condition. If sleep difficulties persist, speak with a qualified healthcare professional.",
  },
  {
    question: "Can I use Nordic Hush on mobile?",
    answer: "Yes. Open Nordic Hush in your phone or tablet browser. No app installation is needed. An internet connection is needed to load the website and recordings, and playback begins when you press play.",
  },
  {
    question: "Will more sounds and stories be added?",
    answer: "The collection may grow over time. There is no fixed release schedule; browse the sound and story libraries to see what is currently available.",
  },
  {
    question: "Who created Nordic Hush?",
    answer: "Nordic Hush was created by Across-IT as a quieter corner of the internet for calming sounds and slow stories.",
  },
];

export default function FaqPage() {
  return (
    <main id="main-content" className="main-container prose-page">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      }} />
      <span className="eyebrow">A LITTLE HELP FOR QUIETER NIGHTS</span>
      <h1>Frequently asked questions.</h1>
      {questions.map(({ question, answer }) => (
        <section key={question}>
          <h2>{question}</h2>
          <p>{answer}</p>
        </section>
      ))}
      <p>
        Explore the <Link href="/sounds">sound library</Link>, browse our{" "}
        <Link href="/stories">sleep stories</Link>, or read more{" "}
        <Link href="/about">about Nordic Hush</Link>.
      </p>
    </main>
  );
}
