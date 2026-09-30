# Nordic Hush

A mobile-first ambient mixer built with Next.js App Router, strict TypeScript and Web Audio. Nine licensed ambient recordings plus procedural brown, pink and white noise. No accounts, database, trackers or advertising.

## Local development

```sh
npm install
npm run dev
```

Open http://localhost:3000. Production: `npm run build`, then `npm start`.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

The Chromium browser suite tests every supplied MP3's download and decoding, overlapping playback, independent channel/master gains, the six-layer limit, cached restarts, removal, pause/resume, internal navigation without new sources or contexts, persistence without autoplay, loading races, HTTP/decode failure retries, timer cancellation/whole-mix fading/expiry, metadata and 360px layout.

The Rain loop test runs the actual decoded recording across two full loop boundaries at a test-only 64x playback rate. The timer test advances wall-clock time then resumes to verify an actual Web Audio fade without waiting 15 minutes. Production playback speed remains 1x. No physical-device testing or subjective seamless-loop quality is claimed.

## Audio catalog

All configuration, paths, defaults and SEO copy live in `src/data/sounds.ts`.

| Sound           | Source                      | Default channel volume |
| --------------- | --------------------------- | ---------------------- |
| Rain            | `/audio/rain.mp3`           | 45%                    |
| Rain on Window  | `/audio/rainwindow.mp3`     | 45%                    |
| Ocean           | `/audio/ocean.mp3`          | 40%                    |
| Stream          | `/audio/stream.mp3`         | 40%                    |
| Forest          | `/audio/forest.mp3`         | 35%                    |
| Fireplace       | `/audio/fireplace.mp3`      | 30%                    |
| Distant Thunder | `/audio/DistantThunder.mp3` | 20%                    |
| Wind            | `/audio/wind.mp3`           | 30%                    |
| Winter Storm    | `/audio/snowstorm.mp3`      | 30%                    |
| Brown Noise     | Procedural                  | 25%                    |
| Pink Noise      | Procedural                  | 22%                    |
| White Noise     | Procedural                  | 18%                    |

The existing `thunder` ID and `/sounds/thunder` route remain stable so saved mixes and links continue working. Saved user volumes are preserved; defaults apply when adding a channel. New sound pages, related cards and sitemap entries derive from the catalog.

## Architecture

```text
src/data/sounds.ts              Sound definitions, source URLs, default volumes
src/lib/audio/
  buffer-cache.ts               Lazy fetch/decode and in-flight/decoded cache
  loop-voice.ts                 Looping AudioBufferSourceNode + channel GainNode
  noise-generators.ts           Procedural white, pink and brown noise
  audio-engine.ts               Persistent context, voices, headroom and fades
src/context/AudioProvider.tsx   Playback, per-channel loading, errors and storage
src/components/                Existing library, mixer, timer and bottom player
src/app/sounds/[slug]/page.tsx  Statically generated detail pages
public/audio/                  Supplied licensed MP3 files, unchanged
 tests/player.spec.ts           Browser regression suite
```

Signal path: each looping source → its own channel gain → master volume gain → whole-mix timer gain → compressor → destination. The timer stage fades the entire mix while retaining the user's master-volume preference.

- `source.loop = true` loops the decoded buffer in the audio engine, without JavaScript scheduling, new requests or new playback instances at loop boundaries.
- Files are fetched only when selected. Decoded buffers and in-flight requests are cached for the current app session, including after removal. Reloading creates a new session.
- Selection tokens prevent completed loads from reviving removed channels or creating duplicate voices after rapid reselection. Failed downloads/decodes are evicted from the cache and can be retried by tapping the card again. Network requests time out after 60 seconds.
- Up to six selected/loading channels are permitted. Each channel has fixed six-layer headroom, a gentle onset, its catalog default volume and an independent gain. Master defaults to 40%; a compressor provides additional peak control.
- Pause fades and suspends the context; resume retains the same source positions. Removing a channel fades and stops only its voice.
- Timer deadlines continue across internal navigation and pauses. The final 30 seconds fade the entire mix. At expiry, all voices stop and pending voice creation is invalidated; the mix configuration remains ready for another session.
- Mix, channel volumes, master volume and timer preference use `nordic-hush-preferences-v1` in localStorage. Opening/reloading the app never autoplays or resumes an expired countdown.

## Recording and device limitations

The supplied recordings are not trimmed, normalized, resampled offline or crossfaded. Native buffer looping avoids network/reload gaps, but silence or discontinuities already present at a file's boundaries can remain audible. For future crossfade looping, extend the voice implementation in `src/lib/audio/loop-voice.ts`; to replace a recording, change the file or its `src` in the catalog.

Recordings are fully decoded on first selection and retain their channel count. Longer files can require substantial download time and decoded memory, especially `rainwindow.mp3` (about 29 MB compressed). No audio files are eagerly preloaded. Future mobile optimization can use shorter licensed loops or a separately designed streaming/crossfade strategy.

Background/lock-screen playback depends on browser and operating-system policies. Test on target physical iOS/Android devices before release. Conservative digital gain does not guarantee a particular physical headphone volume.

## SEO and deployment

Production canonicals are fixed to https://nordic-hush.com in `src/config/site.ts`; local development remains on localhost. Native Next.js metadata supplies unique titles, descriptions, Open Graph and Twitter cards with the existing social image. The central sound catalog owns SEO slugs, prior route aliases, copy, FAQs and related sound IDs. The twelve prior sound routes redirect directly with HTTP 308; only canonical routes are statically generated and listed in the sitemap, alongside `/`, `/sounds`, `/about` and `/privacy`. No fabricated modification dates are emitted.

The homepage includes WebSite JSON-LD; sound pages include matching visible breadcrumbs and BreadcrumbList JSON-LD. Copy and links are server rendered independently of audio initialization. Run `npm run lint`, `npm run typecheck`, `npm run build` and `npm test` before release. After deployment, submit `/sitemap.xml` in Google Search Console and inspect canonical indexing and redirects on the production domain. No deployment has been performed by this update.
