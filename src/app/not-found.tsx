import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="main-container prose-page">
      <span className="eyebrow">A QUIET DETOUR</span>
      <h1>Nothing here but stillness.</h1>
      <p>We couldn’t find that page.</p>
      <Link className="text-button" href="/">
        Back to the sounds →
      </Link>
    </main>
  );
}
