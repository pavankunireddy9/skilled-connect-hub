# ShramSetu — UI build plan

A front-end-only build of the full ShramSetu experience: customer, service provider, and cooperative administrator. Every screen is filled with realistic sample content (Indian names, trades, cities, rupee amounts) so it looks like a live product. No accounts, database, or payments in this version — the focus is a smooth, polished interface.

## Design direction

- Warm, trustworthy "civic tech" look: deep indigo primary with a saffron/amber accent, generous white space, rounded cards, soft shadows.
- Clean modern typography, clear hierarchy, large tap targets — comfortable on phones and desktops.
- Smoothness is a first-class requirement: page and card transitions, animated counters on dashboards, gentle hover/press feedback, skeleton shimmer instead of spinners, smooth status changes on booking cards, sticky headers, and a slide-in mobile navigation.
- Every list has an attractive empty state and every screen works down to small phone widths.

## Screens

### Shared
- Landing page: what ShramSetu is, the three roles, how it works in five steps, trust points, footer.
- Role switcher so anyone can walk through all three experiences without logging in.
- Sign-in / registration screens (visual only) with role choice: customer, independent worker, cooperative.

### Customer
- Home: search by service, popular categories (plumber, electrician, carpenter, painter, driver, cleaner, gardener, caregiver), nearby cooperatives.
- Browse and filter workers: category, location, rating, price, availability, verified badge.
- Worker profile: photo, skills, experience, work photos, reviews, pricing, availability calendar.
- Booking request flow: job details, address, date and time slot, confirmation screen.
- My bookings: upcoming, active, completed, cancelled, with a booking detail view and rate-and-review screen.

### Service provider
- Dashboard: today's jobs, pending requests, earnings snapshot, rating, notifications.
- My profile and services: photo, skills, experience, categories, pricing, portfolio, verification status.
- Bookings: new requests with accept/decline, upcoming, active job with status updates, history.
- Availability: working days, time slots, service areas, an "accepting jobs" toggle.
- Earnings and reviews: income summary, payment status list, ratings and customer feedback.

### Cooperative administrator
- Dashboard: members, open requests, jobs in progress, revenue overview, activity feed.
- Members: directory with trade, status, rating; add member and verification review screens.
- Service requests: incoming requests with an assign-to-member panel showing suitable available workers.
- Jobs board: assigned, in progress, completed.
- Organization settings: profile, service categories, assignment rule preference, payment-share setting.

## Technical notes

- TanStack Start file-based routes under `src/routes/`, grouped as `/customer/*`, `/provider/*`, `/coop/*`, plus landing and auth routes; the landing page replaces the current placeholder index.
- Sample data in typed modules under `src/data/` (workers, cooperatives, bookings, reviews, earnings) shared across roles so the same job appears consistently in customer, provider, and admin views.
- Local React state for interactions (accept a request, toggle availability, assign a member) so the UI feels real within a session; no persistence.
- shadcn/ui components; all colors as semantic tokens in `src/styles.css` (light and dark).
- Motion for React for transitions; reusable app shell with sidebar (desktop) and bottom/slide-in nav (mobile).
- Per-route `head()` metadata with unique titles and descriptions.
