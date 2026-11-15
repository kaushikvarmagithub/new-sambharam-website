# Sambhrama — Product Requirements (PRD)

## Original problem statement
User uploaded an "Executive Summary" document for **Sambhrama**, a Bengaluru-based
professional + celebratory event management brand. Requirement: build a one-page
responsive marketing site with services, portfolio gallery, testimonials, About,
multi-step booking inquiry form, FAQ, footer + a login-protected admin dashboard
to manage bookings, vendors, portfolio items and testimonials. Email notification
to admin on each new booking inquiry (Resend).

## User personas
1. **Visitor / Prospective client** — couples, corporate organizers, festival
   producers. Lands on the page, scans services + portfolio + testimonials,
   submits a multi-step inquiry.
2. **Sambhrama admin** — internal team. Signs in to `/admin/login`,
   manages incoming inquiries, vendor network, portfolio gallery, and testimonials.

## Architecture
- **Frontend**: React 19 (CRA + craco), Tailwind, shadcn UI primitives, framer-motion,
  Phosphor icons, react-fast-marquee, sonner toasts, axios.
- **Backend**: FastAPI (async), Motor (Mongo), bcrypt + PyJWT auth, Resend SDK for email.
- **DB**: MongoDB — collections: `users`, `bookings`, `portfolio`, `testimonials`,
  `vendors`, `newsletter`.
- **Auth**: httpOnly cookie JWT (HS256), admin idempotently seeded on startup.

## Core requirements (static)
- One-page marketing site with sections: Hero, Services, Portfolio (filterable),
  About, Partners marquee, Testimonials, Multi-step Booking form, FAQ, Footer.
- Admin sign-in + dashboard with Overview / Bookings / Portfolio / Testimonials / Vendors.
- Email-notify admin on new booking inquiry via Resend (best-effort, non-blocking).
- WCAG-AA contrast, mobile responsive, no AI-slop fonts.

## What's been implemented — 2026-05-13
- Full backend (`/app/backend/server.py`):
  public booking, portfolio, testimonials, vendors, newsletter endpoints;
  JWT auth + admin-protected CRUD; admin + content seeding; Resend helper.
- Full frontend:
  - Landing page with all 9 sections, Cormorant Garamond + Manrope typography,
    marigold/rose accents, framer-motion entrance animations, lightbox gallery,
    multi-step wizard with stepper.
  - `/admin/login` + `/admin` dashboard (overview stats, bookings status table,
    portfolio/testimonials/vendors CRUD).
- Seed: 8 portfolio items, 4 testimonials, 4 vendors, 1 admin user.
- Test credentials in `/app/memory/test_credentials.md`.

## Iteration 17 — 2026-05-27 (Birthday option + Services curation)
User requested:
(1) add "Birthday" option to the booking form and the portfolio category filters
(2) remove "Conferences" and "Concerts" from the public Services section ("What we do")
(3) keep "Festivals" but as "Traditional Festivals" only.
- **Backend** (`server.py`):
  - Added `"Birthday"` to `_EVENT_CATEGORIES` (used by `PortfolioItem.category`).
  - Added `"Birthday"` to `BookingCreate.event_type` Literal.
  - Verified end-to-end: `POST /api/bookings {event_type: "Birthday"}` returns 201.
- **Booking form** (`BookingWizard.jsx`): inserted `"Birthday"` into `EVENT_TYPES`
  between `"Mehendi"` and `"Corporate Event"`.
- **Public portfolio filter pills** (`Portfolio.jsx`): same insertion into `CATEGORIES`.
- **Admin portfolio category dropdown** (`AdminDashboard.jsx`): same insertion.
- **Services section** (`Services.jsx`):
  - Removed the "Conferences" card and the "Festivals & Concerts" card.
  - Replaced with "Birthdays" (Confetti icon) and "Traditional Festivals" (Flower icon).
  - Re-balanced the grid so the four cards still satisfy the existing
    "Four crafts. One obsession." headline; dropped unused `MusicNotes` +
    `Microphone` imports.
- Lint clean on backend + frontend.

## Iteration 16 — 2026-05-27 (Admin portfolio reordering / prioritisation)
User requested ability to set display priority of portfolio items from the admin —
e.g. promote a specific case study to appear first on the public site.
- **Backend** (`/app/backend/server.py`):
  - Added `display_order: int = 0` to `PortfolioItem` response model.
  - `GET /api/portfolio` now sorts by `[(display_order, 1), (created_at, -1)]`.
  - New `POST /api/admin/portfolio/reorder` admin endpoint accepting
    `{order: [id, id, ...]}` — assigns `display_order = index * 10` to each id
    in the supplied order; returns the freshly-sorted full list.
  - `POST /api/admin/portfolio` now auto-assigns `display_order = currentMax + 10`
    so newly created case studies land at the END of the list (no surprise
    promotion). `PUT /api/admin/portfolio/{id}` leaves the field untouched.
  - Idempotent migration on startup: backfills `display_order` for any pre-existing
    portfolio doc missing the field, preserving the visual order (sorted by
    `created_at` asc → display_order ascending step 10).
  - Seed now stamps `display_order` per index.
- **Admin UI** (`/app/frontend/src/pages/AdminDashboard.jsx`):
  - Each portfolio card now shows a `#N` position badge on its image (amber on
    stone-900/90 backdrop) plus stacked `↑` / `↓` move buttons in the image's
    top-right corner. First/last buttons disable appropriately.
  - `move(id, direction)` performs an optimistic array swap, then persists via
    `POST /admin/portfolio/reorder`; on failure it auto-reverts by re-fetching.
  - Section subtitle updated to teach the workflow: "Use the ↑ / ↓ buttons on
    each card to reorder — #1 appears first on the site."
- Verified end-to-end: logged in as admin, clicked the second card's ↑ button,
  confirmed it became #1 in the admin view AND the public `/api/portfolio`
  response reflected the new order.

## Iteration 15 — 2026-05-27 (Back-to-site button on AdminLogin)
User reported: after sign-out, the AdminLogin page lacked an obvious way back to
the public site on mobile. The existing top-left Sambhrama logo+text link was
acting as the only escape hatch but wasn't visually recognisable as a back action.
- Added an explicit `← BACK TO SITE` pill button at the top of the login form
  card with `data-testid="admin-login-back-button"`. Stays visible on every
  viewport (placed inside the centered card so mobile users see it as soon as
  they land on `/admin/login`).
- Arrow micro-animation on hover, amber accent on focus/hover.
- Kept the legacy top-left brand link for desktop continuity.

## Iteration 14 — 2026-05-27 (Mobile overflow fixes)
User reported on phone: (1) booking stepper "Step 3 / YOU" was being clipped off-screen,
(2) Footer + page edges were visibly overflowing past the viewport.
- **Root cause for #2**: Several decorative absolutely-positioned elements (corner
  marigolds, garlands, glow blobs) live with negative offsets like `-right-20`,
  `-bottom-20`. Some of their parent sections did not have `overflow-hidden`,
  letting those elements push body `scrollWidth > innerWidth`.
- **Fix #2** (root-cause, page-wide): added `overflow-x: hidden` + `max-width: 100vw`
  to `html, body` in `index.css`. Confirmed via mobile (390×844) that
  `documentElement.scrollWidth === window.innerWidth` (no horizontal scroll).
- **Fix #1** (stepper): made the `Stepper` in `BookingWizard.jsx` mobile-first.
  Circles 28px (`w-7 h-7`) on mobile / 32px (`w-8 h-8` sm+). Labels `hidden sm:block`
  so on mobile only the circles + flex-1 connecting lines render. Added a small
  "Step X of N — LABEL" caption (`sm:hidden`) below the stepper so the current
  step name remains visible on phones.
- Lint clean.

## Iteration 13 — 2026-05-27 (Reels — fade-strip pattern consistency)
User asked for the same fade-strip pattern (used by Hero, Services, Testimonials,
BookingWizard) to be applied to the Reels section so the entire page is consistent.
- Replaced Reels' built-in head-to-tail master gradient (which baked the fades into
  the section background) with a **uniform deep dark-purple body** + the standard
  two fade-strip overlays:
  - **Top strip**: `from-stone-900 to-transparent`, h-32 md:h-40 — blends from Portfolio.
  - **Bottom strip**: `from-transparent to-stone-50`, h-32 md:h-40 — blends into About.
- Body gradient simplified to a 4-stop dark purple loop (`#3b0764 → #4c1d95 →
  #581c87 → #3b0764`) so the radial fuchsia/violet/purple glow blobs remain the
  primary depth signal.
- Pattern now identical across every section boundary on the page.

## Iteration 12 — 2026-05-27 (Page-wide seamless section blending)
User feedback: sections were looking like stacked colored "boxes" with hard edges.
Goal: make the **entire page** flow as one continuous canvas with smooth color
transitions at every section boundary.
- **Audit**: Hero (dark) → Services (cream) → Portfolio (dark) → Reels (purple→cream)
  → About (cream) → Testimonials (white) → BookingWizard (dark) → Footer (dark).
  The hard edges were Hero/Services, Services/Portfolio, and Testimonials/BookingWizard
  (plus About/BookingWizard when Testimonials section is auto-hidden because empty).
- **Fix** (minimal, non-invasive): added 128–160px tall absolutely-positioned gradient
  fade strips at the relevant section edges, `pointer-events-none`, `z-[1]`:
  - **Hero**: bottom fade to `stone-50` (blends into Services).
  - **Services**: bottom fade to `stone-900` (blends into Portfolio).
  - **Testimonials**: bottom fade to `stone-900` (blends into BookingWizard) +
    removed the hairline `border-y stone-200` that was creating a visible line.
  - **BookingWizard**: top fade from `stone-50 → transparent` so it gracefully
    receives whatever light section sits above (handles About→BookingWizard when
    Testimonials is empty too).
- Reels already handles its own top (starts at stone-900 matching Portfolio) and
  bottom (ends at stone-50 matching About) via its master gradient — no change.
- Verified each boundary visually in browser at desktop; lint clean.

## Iteration 11 — 2026-05-27 (Reels palette → dark purple with seamless blends)
User wanted the Reels section to be dark purple and blend smoothly with the sections
above (Portfolio — `bg-stone-900`) and below (About — `bg-stone-50`).
- **Section background** is now a single vertical `linear-gradient` engineered to
  start at stone-900 (top, matches Portfolio), pass through purple-950 → purple-900
  → purple-800 (the dark-purple body), then fade through purple-300/lavender into
  stone-50 (bottom, matches About). Three layered radial glows (fuchsia-500,
  violet-500, purple-500) add depth in the dark middle.
- **Text inverted back to light**: glass white/10 overline pill with fuchsia-300
  border + fuchsia-100 text; title gradient fuchsia-200 → pink-200 → violet-200;
  body purple-50/90; link fuchsia-200 hover fuchsia-100.
- Bottom garland (with pink/fuchsia/purple marigold blooms) lands inside the
  lavender→stone-50 fade zone and looks naturally floral against the cream.
- Verified smooth blend visually at the Portfolio→Reels boundary (no seam) and
  Reels→About boundary (twilight-into-morning effect). Lint clean.

## Iteration 10 — 2026-05-27 (Reels palette swap to light purple + pink)
At user's request, recolored the entire Reels section + modal from saffron/rose to
a soft light-purple + pink pastel story while preserving the marigold/garland motifs.
- **Section background**: radial-gradient stack — pink-300 (top-left) + purple-300
  (bottom-right) + fuchsia-300 (center) over a pink-100 → fuchsia-200 → pink-200 base.
- **Glow blobs**: pink-400/30, purple-400/30, fuchsia-300/25.
- **Heading overline pill**: white/70 glass with purple-400 border + soft purple glow,
  dark purple-800 text — readable on the bright pastel backdrop.
- **Title**: from-purple-700 via-fuchsia-600 to-pink-600 gradient `bg-clip-text`.
- **Body text** swapped white→stone-700; link text purple-700 with hover purple-900.
- **Corner marigolds** now fuchsia, pink, purple, violet (with matching shadow glows).
- **Garland string** purple-800 / fuchsia-300 dashed with fuchsia/pink/purple blooms.
- **Reel preview cards**: purple-400 border (hover fuchsia-400), pink → purple Play
  button, pink → purple "Reel" ribbon, purple-tinted bottom caption gradient.
- **Twinkles** + **floating petals** recolored across the pink/fuchsia/purple/violet range.
- **Trailing IG CTA card**: pink/fuchsia/purple gradient with pink → purple IG badge.
- **Modal**: deeper purple radial background (purple-700 → indigo-950 → near-black)
  so the video still pops, pink/fuchsia/purple/violet corner marigolds, gradient
  pink → purple Close + Nav + Mute + Follow buttons, purple-tinted progress dots.
- Linter clean on both files.

## Iteration 9 — 2026-05-27 (Reels UI — traditional event polish)
User asked for a more traditional / festive feel on the Reels section with marigolds
around the frame and pixel-perfect responsiveness across mobile, iPad, and laptop.
- **Vibrant background**: multi-stop radial gradient (saffron amber → deep rose →
  warm sienna) replaces the previous flat dark gradient. Adds layered amber + rose +
  fuchsia glow blobs (sized down on mobile via `blur-[80px]` / `blur-[120px]` md+).
- **Marigold garlands** strung across top + bottom — responsive bloom counts
  (8 / 12 / 18 across xs / sm / md+) with sagging cubic-bezier path + sway animation.
- **Corner marigolds** repositioned **outside** the content frame (`-top-10/-left-10`
  → `-top-20/-left-20` at lg) and resized down at lg (`w-56`/`w-60` instead of
  `w-72`/`w-80`). They no longer crowd or overlap the section headings.
- **Section header overline** now sits inside a glassy stone-950/40 pill with an
  amber border + amber glow — readable on the bright saffron backdrop (previous
  amber-200 text on orange was too low-contrast).
- **Title** uses an amber → orange → rose gradient `text-transparent bg-clip-text`
  for a metallic festive look.
- **Side mid-height accents** (small marigolds at left/right mid) added for desktop.
- **Reel preview cards** got a thicker amber border, hover glow lift, plus two
  decorative marigolds (top-left + bottom-right of each card) and golden gradient
  Play button (amber → rose).
- **ReelModal** updated with matching aesthetic: warm radial-gradient background,
  4 spinning corner marigolds (now `w-16 sm:w-20 md:w-28 lg:w-36`, tucked safely
  off-frame so they never overlap the video), gradient-styled close + mute + nav
  buttons (amber/rose), framed video with marigold corner blooms at md+, progress
  dots gradient.
- **Responsive Tailwind tiers** verified end-to-end: `w-{n}`, padding, gaps and
  garland bloom counts scale across `sm: 640px`, `md: 768px`, `lg: 1024px`.
  Visually verified at 1920px desktop — corner marigolds sit outside the safe
  reading area and the headline badge is fully legible.

## Iteration 8 — 2026-05-27 (Premium Reels section)
At user's request: built a premium, custom Instagram-Reels-style section for
the landing page — NO iframes, full interactive video playback.

- **Backend**: new `reels` collection, `Reel` + `ReelUpdate` models, public
  `GET /api/reels`, admin `POST /api/admin/reels` (multipart — accepts either
  a file upload OR pasted video URL), `PUT`, `DELETE` (also unlinks file).
  `app.mount("/api/uploads", StaticFiles)` serves uploaded videos. Validated
  file size cap 60MB, extensions `.mp4 .mov .webm .m4v`. Seeded 3 vertical
  demo reels from Pexels CDN so the section isn't empty on first launch.
- **Frontend — Landing section** (`Reels.jsx`): luxury dark gradient, inline
  SVG marigold flowers in all 4 corners + scattered floating animated petals,
  horizontal-scroll strip of 9:16 reel cards with hover-glow + lazy-load via
  IntersectionObserver, trailing "More on Instagram" gradient card.
- **Frontend — Fullscreen modal** (`ReelModal.jsx`): TikTok-style vertical
  snap-scroll, current reel autoplays muted, tap to unmute, intersection
  observer auto-updates active reel as user scrolls, progress dots at top,
  prev/next arrows (desktop) + swipe (mobile via native scroll), floating
  "Follow @sambhrama_04" gradient CTA, keyboard navigation (↑ ↓ Esc Space),
  loading spinner per reel, mute toggle button per video.
- **Frontend — Admin tab**: `ReelsAdmin` with drag-drop video upload zone
  (or paste a video URL), caption, posted-date, order-index, edit, 2-click
  confirm delete. Tab added to TABS array between Portfolio and Testimonials.
- **Nav** now has a "Reels" link between Portfolio and About.
- Reels section auto-hides if no reels exist (graceful empty state).

## Iteration 7 — 2026-05-27 (delete UX fix + bookings retention)
- **Bug fix**: deletes on Portfolio / Testimonials / Vendors were silently failing in some browsers/iframe contexts because they relied on `window.confirm()` which is sometimes suppressed. Replaced with a custom `ConfirmDeleteButton` component:
  - 1st click → trash icon transforms into a red "Confirm?" pill
  - 2nd click within 4s → actually deletes
  - Auto-reverts after 4s if no second click
  - Zero reliance on native `window.confirm`, works inside any iframe / preview
- **Bookings are now non-deletable**. Removed the trash button entirely so admins can't accidentally lose customer inquiry records. Status workflow (new → contacted → confirmed → completed → cancelled) is the right way to archive bookings.
- End-to-end browser test confirms: vendor count went 5 → 4 after the 2-click delete; bookings tab has 0 delete buttons.

## Iteration 6 — 2026-05-27 (full CRUD audit)
- **Audit**: Portfolio, Testimonials, Vendors had Create + Delete but were missing **Update** UI. Testimonials backend was also missing a PUT endpoint.
- **Backend**: added `PUT /api/admin/testimonials/{id}`. Portfolio + Vendors PUT endpoints already existed.
- **Frontend AdminDashboard**: refactored Portfolio, Testimonials, Vendors components with an inline edit pattern:
  - Each card now has both ✏️ Edit (pencil) and 🗑 Delete (trash) buttons
  - Clicking Edit pre-fills the existing create form with that item's data, swaps the button to "Save changes" with a floppy-disk icon, scrolls to form, and shows a "Cancel edit" affordance
  - Save → calls `PUT /api/admin/{collection}/{id}` and reloads the list
  - Deleting an item while editing it auto-cancels the edit mode
- **Verified end-to-end via curl**: CREATE → UPDATE → DELETE on all 5 admin entities (bookings, portfolio, testimonials, vendors) returned 200/201 in sequence. Overview stats endpoint reads cleanly.
- **Cleaned 2 stray "ok" portfolio items** from earlier manual testing. Portfolio back to exactly 8 sample case studies.

## Iteration 5 — 2026-05-27 (logo, instagram, new admin creds, portfolio reset)
- **Company logo** added (`/sambhrama-logo.jpg`) — renders in Nav (44px circle), Footer (64px circle), and Admin login. Replaces the all-text wordmark.
- **Social → Instagram only**. Removed FB and LinkedIn. Single Instagram icon + a footer Studio menu link both point to https://www.instagram.com/sambhrama_04/?hl=en (target=_blank).
- **New admin credentials**: username `sambhrama@2026` / password `SSDK@2026`. Backend `LoginRequest.email` now accepts plain `str` (no email format required). New env var `ADMIN_USERNAME` (login identifier); `ADMIN_EMAIL=contact@sambhrama.co` retained as Resend recipient. Legacy admin accounts left in DB.
- **Public contact info** displayed in Booking section: `contact@sambhrama.co`, `+91 87920 36012`, `+91 93416 46148`, `Bengaluru, India`. All clickable links.
- **Client confirmation email** added. POST /api/bookings now fires TWO Resend emails (best-effort, non-blocking): admin notification → `contact@sambhrama.co` + client confirmation → `<visitor email>`. Both styled with Sambhrama branding. `From` headers include `Sambhrama` display name.
- **Portfolio reset to 8 sample case studies** — one per event type: Wedding, Sangeet, Haldi, Mehendi, Corporate Event, Festival, Conference, Pooja. Each presented as "Sample · …" (concept work, not delivered events — honest framing for a new company). Each has long description, 3-4 highlights and a gallery. The `category` Literal in backend extended from 4 → 8 types; booking wizard event tiles extended from 5 → 9; admin Portfolio category dropdown updated.
- **CaseStudy "Related" section** now falls back to any 3 random other case studies (since with one per category, same-category fallback returned empty).
- **All TEST_/dev bookings wiped** from MongoDB. Dashboard starts clean.
- **48/48 backend pytest + 100% frontend tests pass.**

## Iteration 4 — 2026-05-14 (de-experience pass)
At user's request (new company, no operating history yet):
- Removed all "est. 2014" / "since 2014" references (Hero badge, About overline, Footer copy).
- Removed Hero stats column ("11+ Years curating", "420 Events delivered", "98% Repeat clients").
- Rewrote About intro — dropped "For over a decade…" + the "120+ trusted partners" pillar; replaced with a "Hand-picked vendor partners" pillar without specific counts.
- Removed "420+ events" line from Portfolio header.
- **Deleted entire `<Partners />` ("As featured in") section** from Landing.
- **Deleted entire `<FAQ />` ("The questions we hear most") section** from Landing.
- **Testimonials section auto-hides when empty.** Cleared all 4 fake seeded testimonials from MongoDB; removed the testimonial seed list from backend so future restarts don't re-seed them. Admin can add real ones via dashboard → section reappears.
- Removed "Testimonials" link from main nav + footer (will return automatically once a testimonial exists in DB and the section renders — though the nav link itself was removed; can be added back when there are real testimonials).
- Orphan files `Partners.jsx` and `FAQ.jsx` retained on disk (not imported) so they can be re-enabled trivially if the company later wants them back.

## Iteration 3 — 2026-05-14
- **Resend production email pipeline LIVE & verified.** User verified the
  subdomain `contact.sambhrama.co` in their Resend dashboard. Updated
  `/app/backend/.env`:
  - `SENDER_EMAIL=notifications@contact.sambhrama.co` (verified-domain sender)
  - `ADMIN_EMAIL=admin@sambhrama.co` (recipient inbox now matches owned domain)
- Confirmed end-to-end with a real booking POST: Resend accepted and sent
  the email. Backend log: `Booking notification email sent to admin@sambhrama.co`.
- Admin auto-seed now creates `admin@sambhrama.co` alongside the legacy
  `admin@sambhrama.com` user (both work for sign-in, same password).

## Iteration 2 — 2026-05-13
- **Resend email integration LIVE** with user-provided API key. New booking
  inquiries trigger best-effort, non-blocking email notification to admin.
- **Press marquee** replaced text-only logos with inline SVG wordmarks
  (Vogue India, The Knot, Forbes India, Condé Nast, WeddingSutra, BrideToday,
  BW Businessworld, YourStory). Easy to swap for real client SVGs later.
- **Per-portfolio case-study detail pages** at `/portfolio/:id`:
  hero image + date/location/guests meta, two-column story + highlights layout,
  optional gallery grid, dark pull-quote, related case studies grid, CTA back
  to inquiry form. Portfolio model extended with `long_description`,
  `highlights[]`, `gallery[]`, `location`, `guest_count`. All 8 seeded items
  now ship as full case studies. Admin Portfolio form lets users create &
  manage these fields. Lightbox now has a 'Read the full case study' CTA.
- 30/30 backend pytest tests pass. All frontend flows verified by testing agent.

## Prioritized backlog
- **P1**: Add `RESEND_API_KEY` to backend `.env` to enable production email
  delivery (currently empty → emails are logged-skipped, app works without it).
- **P1**: Real photography / logo for press section (placeholder text logos now).
- **P2**: Stripe deposit checkout on booking confirmation.
- **P2**: Calendar integration (Calendly / Google Calendar) for "Schedule a call".
- **P2**: Blog/Resources section + CMS.
- **P3**: i18n (Kannada / Hindi).
- **P3**: Per-user vendor login + availability calendar.

## Known limitations / mocked
- **Email is best-effort**: `RESEND_API_KEY` env var is blank by default → backend
  logs `RESEND_API_KEY not set — skipping email notification` and continues.
  All booking data still saved to Mongo and visible in admin dashboard.
- Press-section logos are text only (no real partner logos provided).
- Admin password is set via env var `ADMIN_PASSWORD` and re-synced on every startup.
