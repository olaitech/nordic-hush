import Link from "next/link";
import { AudioLines, ArrowUpRight } from "lucide-react";

export function Header() {
  return (
    <header className="header">
      <Link className="wordmark" href="/" aria-label="Nordic Hush home">
        <AudioLines size={25} strokeWidth={1.5} />
        <span>
          nordic hush<span className="wordmark-dot">.</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/sounds">Sounds</Link>
        <Link href="/about">About</Link>
        <span className="header-note">
          <span /> A quieter corner of the internet
        </span>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link className="footer-brand" href="/">
          nordic hush.
        </Link>
        <p>Quiet sounds for quieter moments.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/sounds">Sounds</Link>
        <Link href="/about">About</Link>
        <Link href="/privacy">
          Privacy <ArrowUpRight size={12} />
        </Link>
      </nav>
      <span className="footer-note">Made for slowing down.</span>
    </footer>
  );
}
