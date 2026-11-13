# Orion Skys — drone show booking app

A front-end prototype for **Orion Skys Drone Shows**, built with managed **Expo SDK 57**, React Native, React Navigation (native stack) and plain JavaScript. It covers employee and admin sign-in, a three-step drone-show booking request, a review-queue receipt, event management and event details, client sign-off, document review, QR check-in, account settings, an admin fleet manifest, and fee review/checkout.

There is **no backend**. Authentication, bookings, date locking, settings, fees and the fleet list are in-memory mocks that reset when the app reloads. No payment is taken, no receipt email is actually sent, and the demo credentials are not production authentication.

## At a glance

| Item | Value |
| --- | --- |
| Framework | Expo SDK 57 (managed), React Native 0.86, React 19.2 |
| Navigation | `@react-navigation/native-stack`, single stack in `App.js` |
| Language | JavaScript (no TypeScript/typecheck) |
| Styling | React Native `StyleSheet`, shared theme in `src/theme.js` |
| Testing | Jest + `jest-expo`, 22 suites |
| Platforms | iOS, Android, web (Expo Go or simulator/emulator) |
| Backend | None — all services are local mocks |

## What’s included

- **Authentication:** employee and admin sign-in with password visibility, a five-attempt admin lockout and local mock accounts.
- **Booking wizard:** a three-step request flow with a device-date calendar, past-slot disabling, postal-code time zones, draft preservation and conflict recovery.
- **Review and receipt:** a final review with edit-in-place, then a review-queue receipt with the request reference, pending-review state and next steps.
- **Show management:** pending, confirmed, completed and cancelled states, a cancellation confirmation that releases the date, and archive mode for past shows.
- **Event details:** date/time, venue, fleet and client details per show, an uploadable show brief and routes into management and cancellation.
- **Client sign-off:** a verified credential profile with drawn or typed signatures, validation and a session-stored signature record.
- **Document review:** a show picker, dossier sections for agreements, waivers, receipts and flight plans, and a compiled test-PDF download.
- **QR check-in:** a personal employee QR badge, a simulated staff/guest scanner and staff/guest verification result screens.
- **Your events (OSPSA-68):** aggregate metrics, Requests / Upcoming / Past filters, reusable confirmed event cards, pending review alerts, a cancelled-show archive, a Credits workspace and deep links into management.
- **Responsive redesign:** phone-first layouts plus tablet and desktop arrangements for the dashboard, events feed, date and venue step, review, receipt and manage screens, including equal-width footers and clearer phone headers.
- **Supporting screens:** account settings, fee review, checkout and the admin fleet manifest.
- **Verification:** 22 Jest suites covering routing, booking state, payments, event details, sign-off, services and every responsive breakpoint.

## Install and run

Requires Node.js **22.13 or newer** and npm. From the repository root:

```bash
npm install
npx expo start
```

Scan the QR code with an Expo Go app that supports SDK 57, or press `a` for an Android emulator and `i` for an iOS simulator (macOS required for iOS).

For the browser preview:

```bash
npx expo start --web
```

### Demo accounts

These are checked locally by `src/services/employeeAuthService.js` and `src/services/adminAuthService.js`.

| Role | Username | Password | Lands on |
| --- | --- | --- | --- |
| Employee / client | `test` | `password1234` | Employee dashboard |
| Admin | `admin` | `admin1234` | Drone fleet manifest |

Both demo accounts lock after **five** incorrect passwords. The login screen offers a simulated email request and unlock link; **no email is sent**, and the in-memory lock disappears on app reload. This is not security: production requires server-side authentication, lockout enforcement and real email-token verification. The **Enterprise SSO** button on the admin screen is a placeholder and does nothing.

## Screen map

All routes are registered in `App.js` with `headerShown: false`; each screen renders the shared `ScreenLayout`.

| Route | Screen file | Purpose |
| --- | --- | --- |
| `Welcome` | `WelcomeScreen.js` | Choose Employee or Admin sign-in |
| `EmployeeLogin` | `EmployeeLoginScreen.js` | Employee sign-in with password visibility toggle |
| `AdminLogin` | `AdminLoginScreen.js` | Admin sign-in with five-attempt lockout |
| `EmployeeDashboard` | `EmployeeDashboard.js` | Stats, next show, schedule/events/account tabs |
| `EmployeeEvents` | `EmployeeEventsScreen.js` | Your events: summary metrics, status filters, confirmed cards and pending alerts |
| `Credits` | `CreditsScreen.js` | Credits balance, how credits work and recent account activity |
| `BookingDateVenue` | `BookingDateVenueScreen.js` | Booking step 1 — date, time, venue, contact details |
| `BookingReview` | `BookingReviewScreen.js` | Booking step 2 — final review before submission |
| `BookingConflict` | `BookingConflictScreen.js` | Recovery when the chosen date was just taken |
| `BookingManage` | `BookingManageScreen.js` | View and cancel a show, releasing its date |
| `BookingSubmitted` | `BookingSubmittedScreen.js` | Booking step 3 — review-queue receipt |
| `EventDetails` | `EventDetailsScreen.js` | Show details, brief upload and event management |
| `EventAction` | `EventActionScreen.js` | Placeholder detail for a secondary event action |
| `ClientSignOff` | `ClientSignOffScreen.js` | Credential check and drawn or typed signature |
| `DossierShowSelect` | `DossierShowSelectScreen.js` | Choose a show for document review |
| `DocumentDossier` | `DocumentDossierScreen.js` | Dossier sections and test-PDF generation |
| `QRCodeScanner` | `QRCodeScannerScreen.js` | Simulated staff/guest check-in scanner |
| `EmployeeQRCode` | `EmployeeQRCode.js` | Personal employee QR badge |
| `EmployeeSuccessfulScan` | `EmployeeSuccessfulScanScreen.js` | Staff check-in verification result |
| `CustomerSuccessfulScan` | `CustomerSuccessfulScanScreen.js` | Guest check-in verification result |
| `PaymentStatus` | `PaymentResultScreen.js` | Authorized, partial or declined payment result |
| `DroneManifest` | `SerializedDroneManifestScreen.js` | Admin fleet registry with search |
| `Dashboard` | `DashboardScreen.js` | My Account shortcuts: booking, fees, settings, documents, sign-off and QR |
| `AccountSettings` | `AccountSettingsScreen.js` | Notification streams, language, time zone |
| `FeeReview` | `FeeReviewScreen.js` | Coverage/policy fees (OSPSA-340 preview) |
| `Checkout` | `PaymentCheckoutScreen.js` | Operations summary and simulated payment submission |

Flow overview:

```text
Welcome
├─ Employee Sign In → EmployeeLogin → EmployeeDashboard
│    ├─ + Schedule a show / SCHEDULE → BookingDateVenue → BookingReview → BookingSubmitted
│    │                                      ↑                    │
│    │                                      └──── BookingConflict ┘  (date was taken)
│    ├─ EVENTS → EmployeeEvents → BookingManage
│    │    └─ Credits → Credits (balance, rules and activity)
│    ├─ Review your show brief (next show) → EventDetails → EventAction / BookingManage
│    └─ ACCOUNT → Dashboard (My Account)
│         ├→ FeeReview → Checkout → PaymentStatus
│         ├→ AccountSettings
│         ├→ DossierShowSelect → DocumentDossier
│         ├→ ClientSignOff
│         ├→ QRCodeScanner
│         └→ EmployeeQRCode
└─ Admin Sign In → AdminLogin → DroneManifest
```

The logo in the shared header calls `navigation.popToTop()`, returning to `Welcome`. Account Settings is the one screen that overrides it, sending the logo back to the employee dashboard.

## The booking flow

The wizard header (`BookingWizardProgress`) has three labels: **DATE & VENUE**, **REVIEW**, **REQUEST**. The current step uses the lime accent; earlier steps are plain text and later steps stay dim.

### Step 1 — Date & venue (`BookingDateVenueScreen`)

- Calendar opens on the **device's current month** and the **current day is bookable** (`MIN_BOOKING_LEAD_DAYS = 0`). **Nothing is selected** until a day is tapped. Sundays are bookable.
- **One show per day.** Dates already claimed by an active submission are red and disabled.
- 24 hourly time slots from `12:00 AM` to `11:00 PM`; the default is `8:00 PM`. When today is selected, **slots at or before the device's current hour are disabled** (`isTimeSlotPast`); if the default has already passed, the next available slot is picked automatically, and after 11 PM the screen says no slots remain today. Continue stays disabled for a passed slot.
- Venue fields are event name, venue name, street address, city/country and postal code. Venue name, street, city and postal code are required; **Continue to booking review** stays disabled until a date is selected and all four are filled.
- The venue **postal code** decides the show's time zone (`src/utils/postalCodeTimeZones.js`, e.g. `018956` → Singapore, `10001` → New York). The saved account preference is only a fallback.
- **Continue** trims the values, saves a session draft (`saveBookingDraft`) and opens `BookingReview` with that draft.
- The back link returns to `EmployeeDashboard` (not to the review step).
- The month title opens a **month/year picker**; future years up to ten ahead are selectable.

Venue details are pre-filled with the demo draft (`Marina Bay Event Deck`, `10 Bayfront Avenue`, `Singapore`, `018956`), so only a date has to be chosen for a quick walkthrough.

### Step 2 — Final review (`BookingReviewScreen`, OSPSA-57)

- **Date & Venue** card shows the formatted schedule (e.g. `Sat, 21 Nov 2026 · 8:00 PM`), the short time-zone label, venue name and address.
- **Edit** in the card header is the only in-wizard way back to step 1; it passes the draft so every value is preserved. The old `← Back to date & venue` link was removed on purpose.
- **Event specifications** shows the event name, drone count (`200 drones`) and duration (`10 minutes`) from the saved draft; these are read-only in this step.
- **Request contact** comes from `mockRequestContact`: Kenneth Elliott · Apex Global Corp, `kenneth.elliott@csus.edu`.
- A disclaimer explains that submitting sends a request for venue and airspace review, not a confirmed booking.
- **Submit booking request** uses a paper-plane send icon instead of an arrow. It claims the slot through `requestBookingSlot`:
  - success → marks the draft submitted and opens `BookingSubmitted` with the booking and submission;
  - a same-day conflict → opens `BookingConflict` with the draft intact.
- Microcopy underneath: “No payment is due when submitting this request.”

### Step 3 — Review-queue receipt (`BookingSubmittedScreen`, OSPSA-56)

- Three-segment wizard header with **REQUEST** lit. The old “You're in the review queue.” heading is intentionally removed on this screen only, so the check status leads the content.
- Double-ring check badge with the centered **BOOKING REQUEST RECEIVED** label beneath it, then the reminder that the show is **not confirmed yet**. These use the lime accent (`colors.accent`); cyan was removed from this page.
- Ticket card pulls live from the booking and submission:
  - reference top-left, e.g. `REQ-20261121-2000` (date + 24-hour time, built by `submissionReference`);
  - amber **PENDING REVIEW** pill top-right;
  - event title, scheduled date/time, time zone, drone count, duration and `Venue · City`.
- **WHAT HAPPENS NEXT** lists three steps. Step 1, “Venue & airspace review”, is active: lime number circle with a lime ring on a dark tint (`accentTint`) and a **gold** title that ties to the pending pill. Steps 2–3 stay dimmed with muted numbers.
- **Responsive layout:** desktop and iPad put the centered check status across the top, then the ticket in a 52% left column with **WHAT HAPPENS NEXT** beside it. The receipt summary is two-by-two on both wide layouts, and the next steps stay vertical; this keeps a landscape iPad (1024×768) on one screen. The “temporarily saved on this device” note sits after both columns as a single full-width row. Phones keep the stacked cards and scroll.
- Footer: a full-bleed bar with a lime mail badge and **RECEIPT BY EMAIL** over “A request receipt will be sent to kenneth.elliott@csus.edu”; **+ Schedule another show** comes first, followed by **→ View my requests** (to `EmployeeDashboard`) on desktop and iPad. On phones the note sits above one action row built exactly like the manage-show footer: both compact 38 px actions sit in equal flex slots, labels stay at 11 px, and the bar carries 32 px bottom clearance so the iPhone home indicator never covers the buttons.
- **Phone header:** this screen alone uses a compact label row (`compactHeader`), trimming the header from 71 px to 32 px; iPad and desktop keep the standard header.
- If there is no booking, the screen shows a “No request to show” recovery card.

### Conflict recovery (`BookingConflictScreen`)

When the chosen date was already claimed, the screen explains that shows run once per day and shows the exact unavailable slot (accepting ISO strings or separate date/time fields). It restores every cached event detail, marks it **● SAVED**, and offers **Choose another date** / **← Return to schedule**, both of which return to step 1 with `focusCalendar: true` and an inline “date no longer available” notice. Nothing needs to be retyped.

### Manage or cancel (`BookingManageScreen`)

Reached from the dashboard’s **Manage event** link or an events-list card. It shows reference, date, time, time zone, venue, address, fleet size and duration with the record’s real status (`● IN REVIEW`, `● CONFIRMED`, `● COMPLETED` or `● CANCELLED`). **Cancel booking** asks for confirmation, then cancels the submission. Cancelled shows leave the dashboard and the Upcoming feed but stay in the events Past feed marked `● CANCELLED`, because the archive reads the full session ledger. Completed shows open in archive mode with no cancel action.

On tablet and desktop the screen uses the same treatment as the review and receipt pages: event identity and timing on the left, venue and logistics on the right, then the full-width device note, all inside one frame at 1366×700 and 1024×768. Phones stack the same order. The cancelled state swaps into the same layout with a centered red double-ring **✕ BOOKING CANCELLED** status, a red-tinted event card, and the date-release note below; the old `// BOOKING CANCELLED` heading and in-card cancellation card are gone. There is no top back link on this screen — the footer button returns to the dashboard. Its full-bleed footer shows a **SHOW STATUS** note beside two aligned actions on desktop/iPad, and a compact one-row action pair with 11 px labels on phones; the two buttons stay equal width down to a 320 px screen. Cancelled and completed footers put **+ Schedule another show** first and **→ Back to dashboard** second. Phone footers keep the same 73 px height but show only the action buttons, vertically centred; the **SHOW STATUS** note is desktop/iPad only.

## Other screens

### Employee dashboard and events

- Dashboard greets “Welcome back, Kenneth”, shows **scheduled shows** / **in review** counts, a **+ Schedule a show** button, the next chronological show (reference, status, date, venue, manage link), a “Review your show brief” action, and a help row. Both counts start at `00`: a pending request raises **IN REVIEW**, while confirmed upcoming shows raise **SCHEDULED SHOWS**. The events feed seeds its demo schedule on first visit. On desktop (1200+ px) the portal uses two columns — stats, schedule action, next action and help on the left; the next show on the right — so it fits one page at 1366×700 and larger. iPad/tablet and phone keep the previous centered single column (max 720 px).
- The bottom navigation is shared (`EmployeeBottomNav`): HOME, SCHEDULE, EVENTS, ACCOUNT.
- **Your events** (`EmployeeEventsScreen`) is the schedule feed:
  - Header path `CLIENT SCHEDULE // 2026`, title **Your events**, a **Credits** button (to the dedicated `Credits` workspace) and the EVENTS tab lit.
  - The readout line is derived from the live ledger, e.g. `2 scheduled shows • 1 request in review`.
  - The **Requests**, **Upcoming** and **Past** segmented tabs swap the feed immediately without a reload. Requests lists open proposals; Upcoming shows confirmed cards plus amber pending alerts; Past archives completed, dated or cancelled shows, with cancelled cards keeping their red `● CANCELLED` status. Each tab has its own helper line, e.g. `UPCOMING // VENUE LOCAL TIME • UTC+8`.
  - Cards render through the shared `src/components/EventFeedCard.js` node, so the Upcoming, Requests and Past feeds keep one layout. Confirmed cards use a lime date block, a green `● CONFIRMED` pill, and clock/location icons beside the schedule line (`Sat, 14 Nov 2026 • 8:00 PM SGT`) and `Venue • City`. **View event & manage** and the circular arrow both open `BookingManage`.
  - The amber pending alert (`Apex Product Launch • 5 Dec`, “Venue & airspace review pending.”) opens the same management screen. New shows start from the **SCHEDULE** tab; the feed itself has no schedule button.
  - `src/services/eventFeedService.js` seeds four demo shows into the session ledger on the first visit (2 confirmed, 1 pending, 1 completed) so the feed is populated out of the box. Real submissions and cancellations update the same ledger.
  - Every filter has its own empty state. Tests can pass `seedDemoData={false}` to start from an empty ledger.
  - On desktop the confirmed cards and pending alerts use a two-column feed, so the dashboard fits one screen at 1366×768 and larger instead of leaving a narrow centered column and a long scroll.
- **Review your show brief** opens `EventDetails`; the contact-coordinator row is still a visual placeholder.

### Credits workspace (`CreditsScreen`)

The **Credits** button in the events header opens a dedicated workspace instead of the general account hub. It shows the available balance (`1,120 credits`, with `● ACTIVE`), a three-step “How credits work” card and a recent-activity ledger with top-ups and show reservations. Tablet and desktop use two columns; phones stack the balance, rules and activity. Both the back link and the footer action return to **Your events**; the footer action is full-width on phones, 240 px on iPad and 320 px on desktop. Credits are local mock data in `src/services/creditsService.js`; no top-up or payment is connected.

### Event details (`EventDetailsScreen`)

Reached from **Review your show brief** on the employee dashboard. It shows the event’s date, time zone, duration, venue, fleet size, choreography and client, plus a **Upload show brief** action backed by `expo-document-picker` (the picked filename is displayed; nothing is uploaded). The **Manage your event** rows open `EventAction`, a compact placeholder detail screen, and **Request cancellation** opens `BookingManage`.

### Client sign-off (`ClientSignOffScreen`)

Reached from **Client sign-off** in My Account. It shows a verified credential profile and accepts either a drawn signature (`SignaturePad`) or a typed legal name, validates the input, saves through a mock async call and confirms with a toast. Records stay in `src/services/signOffService.js`; nothing is transmitted.

### Document review (`DossierShowSelectScreen` → `DocumentDossierScreen`)

Reached from **Review documents** in My Account. Pick a mock show, review agreements, waivers, receipts and FAA flight plans, then press **Reconcile & Generate Complete PDF**. `dossierPdfService` writes a one-page test PDF locally and downloads it on web or shares it through `expo-sharing` on device; no server is involved.

### QR check-in

My Account links to the personal **Employee QR Code** (`EmployeeQRCode`, encoding `mockEmployee` with `react-native-qrcode-svg`) and **Scan QR codes** (`QRCodeScanner`). The scanner is a static simulation — framed viewfinder, target event, today’s scan count and a Back tab — with no camera or decoding. `EmployeeSuccessfulScan` and `CustomerSuccessfulScan` are registered verification-result screens but are not linked from the scanner.

### Admin fleet manifest

`SerializedDroneManifestScreen` is a static sample of six airframes with an airframe/RFID search, status badges, battery telemetry and a five-tab fleet bottom bar. Cyan (`colors.cyan`) is still used here and by the drone launch animation; the rest of the app uses lime, gold, green and red. The header is hard-coded to `TOTAL: 120 UNITS` while only six rows are mocked.

### Client account and settings

`DashboardScreen` (“My Account”) has seven shortcuts: schedule a show, review booking fees, account settings, review documents, client sign-off, scan QR codes and the employee QR code.

`AccountSettingsScreen` renders four notification streams — email (on), push (off), show updates (on), billing (on) — plus a security/contractual email footnote, language (`English` default) and time-zone pickers, and Save/Cancel. Save calls `saveNotificationSettings` (500 ms mock) and shows a `Preferences saved` toast; failure shows an inline error. Cancel and the `< ACCOUNT` breadcrumb return to `Dashboard`. The saved time zone becomes the fallback for bookings when a postal code cannot be resolved.

### Fee review and checkout (OSPSA-340 preview)

- `FeeReviewScreen` calls `getBookingFees(1)` and renders loading, a retryable error, or **Commercial Airspace Coverage** with a **$450.00** policy premium, coverage toggle, carrier and period.
- **Proceed to Checkout** shows the Operations Summary. The five mock line items total **$4,674.00**; turning coverage off removes the $450 liability row and totals **$4,224.00**.
- Promo codes and split payment are explicitly preview-only and do not change the amount; neither calls a backend.
- **Continue to Payment Portal** creates a mock payment in `paymentService` and opens `PaymentStatus` — **Payment Authorized**, **Partial Settlement** or **Payment Declined** depending on the outcome. Use `?outcome=partial` or `?outcome=declined` on web (or a `paymentOutcome` route param) to preview those states; no real charge is made.
- Money is handled as integer cents with `calculateTotalCents` / `formatUSD`.
- The header progress divider is four segments for this flow (coverage = phase 3, checkout = phase 4). Booking screens hide it and use the three-step wizard header instead.

### Connection lost

`App.js` shows a full-screen **Connection lost** overlay when NetInfo reports no connection or the browser fires an `offline` event. It disappears when connectivity returns; it is an overlay, not a separate route.

## Design system

Colors live in `src/theme.js`:

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#000000` | App background |
| `card` | `#111620` | Cards and footer bars |
| `field` | `#0A0A0A` | Inputs and inset panels |
| `accent` | `#DAFF02` | Primary actions, active step, lime badge/check |
| `accentTint` | `#1A2200` | Tinted active backgrounds |
| `gold` | `#FFC107` | Pending review, conflicts, step-1 review title |
| `green` | `#00C795` | Confirmed/saved states |
| `error` | `#FF3B30` | Booked dates, cancelled/destructive states |
| `muted` | `#8C8C8C` | Secondary copy |
| `border` | `#262626` | Dividers and outlines |
| `cyan` | `#00E5FF` | Admin fleet manifest only |

Typography is a monospace stack (`Menlo` / `monospace` / `Consolas`) for labels, values and buttons, with system sans-serif for body copy.

## Responsive layout

`useResponsiveLayout` reads `useWindowDimensions` and returns a breakpoint:

| Width | Mode | Gutter | Max width |
| --- | --- | --- | --- |
| `< 768` | phone | 18 px | 767 px |
| `768–1199` | tablet | 32 px | 1200 px |
| `1200+` | desktop | 48 px | 1440 px |

Tablet and desktop switch two-column cards (settings, fee/checkout), larger type and 56 px primary buttons. The booking step has its own large-screen layouts: on desktop (1200+ px) calendar, show-time and venue sit side by side so the step fits one frame without scrolling at 1280×800 and larger; the show-time column takes 27% of the row with a tighter 10 px gutter, so every 24-hour label (including AM/PM) fits without truncation while the venue card keeps its original width. On tablets the calendar and show-time share the top row and **Venue & Address spans the full width underneath**, with event/venue names paired and the street address across the whole card. This tablet arrangement keeps a portrait iPad (834×1112) on one screen; a short iPad landscape window scrolls. Windows shorter than 800 px also get tighter content, footer, back-link spacing and 40 px time slots. The review step splits into two columns only on desktop: Date & Venue (with its calendar block and Edit link) leads on the left, Event Specifications and Request Contact stack on the right, and the submission disclaimer runs full width underneath in a 52/48 split. iPad keeps **one stacked column in both orientations**, with compact cards that fit a landscape frame without scrolling: Date & Venue share the top card, the three specification fields sit in one row, and the contact and disclaimer stay single compact blocks. Phones keep the same stacked order. The desktop review and an iPad in landscape (1024×768) fit one frame without scrolling. Its footer pairs a lime-check **no payment due** note with the submit button: the note sits beside a 320 px button on desktop and tablet, and becomes a single compact line above a full-width button on phones. The receipt step puts a centered check status above a two-column ticket/next-steps grid on both desktop and iPad, with a two-by-two ticket summary and vertical steps; this keeps 1024×768 on one screen. Phones stack the cards. Its full-bleed footer pairs the email receipt note with the **+ Schedule another show** link and a 320 px (240 px on iPad) **View my requests** button; on phones the note sits above an equal-width action pair matching the manage-show footer, with 32 px bottom clearance for the home indicator. A phone-only compact header trims 39 px from the receipt header. The device note runs full width after the two receipt columns on tablet and desktop. The manage step mirrors that split, with event timing on the left and venue/logistics on the right, a full-width note underneath, and a full-bleed **SHOW STATUS** footer whose two actions share one compact row on phones. The synthetic web status bar appears only on phone-sized web views; native devices use the real system status bar. Orientation is enabled in `app.json`.

The shared `ScreenLayout` scroll view sets `keyboardShouldPersistTaps="handled"`, `automaticallyAdjustKeyboardInsets` on iOS and `keyboardDismissMode="on-drag"`, so focusing an input keeps it above the keyboard and dragging dismisses it.

## Data and mocks

Everything is session state; a reload clears it. Replace these modules with real API calls when a backend exists.

| Module | Stands in for | Behavior |
| --- | --- | --- |
| `services/bookingDraftService.js` | `POST /api/bookings` + draft cache | `DEFAULT_BOOKING_DRAFT`, venue validation, trimmed session records |
| `services/bookingConflictService.js` | Booking/date-lock API | One active show per date, references, conflict payloads, cancel releases the date |
| `services/eventFeedService.js` | `GET /api/events` | Four demo shows seeded once into the booking ledger |
| `services/eventDetailsService.js` | `GET /api/events/:id` | Show details merged with the selected submission |
| `services/dossierPdfService.js` | `GET /api/dossiers/:id/pdf` | Builds a one-page test PDF and downloads or shares it |
| `services/signOffService.js` | `GET/POST /api/authorizations/:id` | Credential profile, signature validation and session records |
| `services/paymentService.js` | Payment API + Stripe webhook | Mock payment lifecycle and the normalized webhook contract |
| `services/creditsService.js` | `GET /api/clients/me/credits` | In-memory balance and activity ledger shown in the Credits workspace |
| `services/settingsService.js` | `GET/PUT /api/clients/me/settings` | In-memory store, 500 ms save, failure flag |
| `services/feeService.js` | `GET /api/bookings/:id/fees` | 600 ms mock from `mockData.js`, failure flag |
| `services/employeeAuthService.js` | Employee auth | Local username/password table |
| `services/adminAuthService.js` | Admin auth | Local table, five-attempt lockout |
| `mockData.js` | Account/profile API and pickers | Request contact, fee payload, languages, time zones |

Other details:

- A submission reference is `REQ-YYYYMMDD-HHMM` in 24-hour time (e.g. `REQ-20261121-2000`). If the time cannot be parsed, it falls back to `REQ-YYYYMMDD`.
- Submitting the same draft twice is idempotent, so a double tap cannot lock the user out of their own request.
- Dates are exclusive per active show; cancelling frees the date for another request.
- `active` submissions are `pending`; cancelled records remain in memory, release their date, leave the dashboard and Upcoming feed, and stay visible in the events Past feed.

### Simulating service failures

```bash
EXPO_PUBLIC_SIMULATE_FEE_FAILURE=true npx expo start --web
EXPO_PUBLIC_SIMULATE_SETTINGS_FAILURE=true npx expo start --web
```

In PowerShell:

```powershell
$env:EXPO_PUBLIC_SIMULATE_FEE_FAILURE = "true"
npx expo start --web
```

Restart without the variable to restore normal behavior. These flags are public configuration, not secrets.

## Tests and checks

```bash
npm test
npm test -- --runInBand
npm run check
npx expo export --platform all
```

Current suite count (13 November 2026): **22 Jest suites**.

- Run `npm install` before `npm test`: the event-details, QR-code and sign-off screens add `expo-document-picker`, `react-native-qrcode-svg` and `react-native-svg`.
- `npm test -- --runInBand` runs every suite once.
- `expo export --platform all` builds the web, Android and iOS bundles from the same install.

| Test file | Covers |
| --- | --- |
| `fees.test.js` | Cents arithmetic, USD formatting, invalid input |
| `feeService.test.js` | Mock delay, simulated failure/retry, unknown booking, no mutation |
| `screens.test.js` | Fee review loading/error, checkout totals, coverage switch, promo/split, progress dividers, missing booking |
| `settings.test.js` | Notification defaults/toggles, pickers, save success/failure, cancel and breadcrumb routing, dashboard links |
| `settingsService.test.js` | Saved payload, delay, failure |
| `responsive.test.js` | Phone/tablet/desktop breakpoints, short-window compaction, footer width, desktop booking three-column layout, tablet full-width Venue & Address, desktop and tablet receipt layouts, full-width receipt note, phone receipt compact action row and header, home-indicator clearance, manage two-column and compact footer layouts, cancelled status layout, footer action order, archived-note visibility |
| `credits.test.js` | Balance/rules/activity content, back and booking routes, stacked phone vs two-column wide layout |
| `eventCardsResponsive.test.js` | Confirmed card layout at 320, 390, 768 and 1440 px, including wrap and non-truncation rules |
| `clientSignOff.test.js` | Credential profile, drawn vs keypad signatures, validation and the saved record |
| `droneLaunch.test.js` | Launch overlay, sign-in transition and provider fallback |
| `eventDetails.test.js` | Event details content, brief upload and management-row routing |
| `paymentService.test.js` | Payment lifecycle and webhook verification |
| `employeeLogin.test.js` | Demo credentials, invalid credentials, password visibility, logo home |
| `adminLogin.test.js` | Five-attempt lockout and reset, inert SSO button |
| `employeeDashboard.test.js` | Dashboard content, bottom nav, submitted show, events routing |
| `employeeEvents.test.js` | Seeded metrics, Requests/Upcoming/Past order, cancelled archive, empty states, clock/location logistics icons, card/arrow/alert routing, Credits routing and the absence of a feed schedule CTA |
| `bookingWizard.test.js` | Same-day/Sundays, empty initial selection, past-slot disabling, late-night fallback, calendar paging, time zone from postal code, validation, draft save, review submission, conflict routing, booked-date blocking |
| `bookingConflict.test.js` | Backend slot parsing, conflict screen restore/routing, fallback draft, whole-date ledger, receipt content |
| `bookingCancellation.test.js` | Cancelling frees the date, confirmation flow, confirmed/completed statuses, dashboard routing |
| `bookingTimezoneSync.test.js` | Postal-code time zone overrides the saved preference |
| `postalCodeTimeZones.test.js` | Singapore, US ZIP prefixes, London/Sydney/Tokyo, unsupported codes |
| `manifest.test.js` | Fleet manifest rendering and search filtering |

Tests use `react-test-renderer` with `jest-expo`; there are no snapshot tests.

## Folder structure

```text
App.js                                Navigation stack, offline overlay, NetInfo config
app.json                              Expo app config and web bundler
package.json / package-lock.json      Dependencies, scripts, Jest preset
assets/orion-skys-logo.png            Brand logo used by the header and welcome screen
src/
  theme.js                            Colors, spacing, mono font, responsive breakpoints
  mockData.js                         Notification defaults, pickers, request contact, fee payload
  utils/
    bookingCalendar.js                Month grid, lead time, slots, date-key helpers
    postalCodeTimeZones.js            Postal code → time zone
    timeZones.js                      Time-zone labels and formatting
    fees.js                           Integer-cent totals and USD formatting
  services/
    bookingDraftService.js            Draft cache and venue validation
    bookingConflictService.js         Session booking ledger, date lock, conflicts, cancel
    eventFeedService.js               Demo schedule fixture seeded into the events ledger
    eventDetailsService.js            Event detail defaults merged with a submission
    dossierPdfService.js              Local one-page PDF and download/share
    signOffService.js                 Credential profile, signatures and session records
    paymentService.js                 Mock payment lifecycle and webhook contract
    settingsService.js                Preferences store and mock save
    feeService.js                     Mock fee fetch with failure flag
    employeeAuthService.js            Employee demo accounts
    adminAuthService.js               Admin demo accounts and lockout
  components/
    BookingWizardProgress.js          Three-step DATE & VENUE / REVIEW / REQUEST header
    CalendarPicker.js                 Month grid, month/year jump, booked dates
    DropdownSelect.js                 Expanding picker overlay
    EmployeeBottomNav.js              HOME / SCHEDULE / EVENTS / ACCOUNT bar
    EmployeeIcon.js                   Inline SVG/View icons for the employee screens
    DemoUnlock.js                     Demo-only lockout reset links
    DroneGlyph.js                     SVG drone icon used by the launch animation
    DroneLaunchTransition.js          Animated drone-launch overlay and provider
    EventFeedCard.js                  Shared event card for every events filter
    SignaturePad.js                   Drawn signature capture surface
    FeeRow.js                         Fee label/amount line
    PrimaryButton.js                  Lime button with icon/arrow/loading states
    ScreenLayout.js                   Safe area, header, scroll view, footer, keyboard handling
    SendPlaneIcon.js                  Paper-plane submit icon drawn with thin bars
    Toast.js                          Auto-dismissing success toast
    ToggleSwitch.js                   Animated lime/grey switch
  screens/                            One file per route (see screen map)
__tests__/                            Jest suites listed above
```

`node_modules/`, `.expo/`, `dist/`, coverage, `.env*`, logs, signing material and `.freebuff/` are ignored by Git.

## Known limitations

- **Not production authentication.** Credentials are plain-text in the bundle, there is no session token, role enforcement or password reset. Client/employee/admin screens are all reachable in the same stack.
- **No backend.** Bookings, date locks and settings live in memory and disappear on reload. Two devices cannot see each other's bookings, and receipt emails are not sent.
- **Demo schedule fixture.** `eventFeedService.js` seeds four sample shows the first time the events screen opens. They live in the same ledger as real requests and block their dates until the app reloads.
- **Simulated payments.** Checkout runs through an in-memory `paymentService`; there is no Stripe key, network call or charge. Promo codes and split payment remain visual only.
- **Static admin data.** The fleet manifest is six sample rows; the header total is hard-coded, and the fleet tabs do not navigate.
- **Placeholder actions.** Admin Enterprise SSO, the contact-coordinator row, the event management rows (`EventAction`) and the QR scanner have no real behavior.
- **Mock event, sign-off and document data.** `eventDetailsService`, `signOffService` and `dossierPdfService` keep or generate local data; brief uploads, signatures and dossier PDFs never leave the device.
- **Device QA outstanding.** The iOS keyboard-inset behavior and native rendering were implemented but not exercised on a physical device in this environment. Verify on an iPhone in Expo Go.
- **Audit advisories.** `npm audit` reports **5 high-severity advisories** in the Expo CLI dependency chain (`node-forge`, `zod`). `npm audit fix --force` would downgrade Expo to 44, so it has deliberately not been applied; review upstream SDK-compatible fixes before release.
- **Desktop/web visual QA** has been done in a browser at phone, tablet and desktop widths, but not exhaustively on every screen.

## Git: branches and pull requests

This checkout uses the remote `origin` → `https://github.com/JonathanDLee24/Orion-Skys-Smartphone-App.git`.

Current state (13 November 2026):

| Branch | Status | Contents |
| --- | --- | --- |
| `main` | published | Baseline. Includes payments (PR #10), the QR scan page (PR #13), PDF dossier (PR #14), client sign-off (PR #15), the OSPSA-68 events dashboard (PR #16), event details (PR #17), the employee QR page (PR #18), splash/login (PR #19) and login protections (PR #20) |
| `OSPSA-68-events-dashboard` | merged | Your events dashboard, cancelled-show archive and responsive layout pass (PR #16) |
| `OSPSA-286-admin-dashboard` | open work | Admin dashboard destinations and admin-mode routing; it branched from the pre-merge OSPSA-68 tip, so merge `main` before opening its PR |

Push a feature branch and open its pull request into `main`:

```bash
git status --short --branch
git push -u origin <branch>
gh pr create --base main --head <branch> --title "OSPSA-…" --body "…"
```

Without `gh`, open `https://github.com/JonathanDLee24/Orion-Skys-Smartphone-App/compare/main...<branch>?expand=1`.

Pushing more commits updates an open PR automatically. After a PR merges, fast-forward local `main`:

```bash
git checkout main
git pull --ff-only
```
