# Orion Skys — drone show booking app

A front-end prototype for **Orion Skys Drone Shows**, built with managed **Expo SDK 57**, React Native, React Navigation (native stack) and plain JavaScript. It covers employee and admin sign-in, a three-step drone-show booking request, a review-queue receipt, event management, account settings, an admin fleet manifest, and the earlier fee-review/checkout preview.

There is **no backend**. Authentication, bookings, date locking, settings, fees and the fleet list are in-memory mocks that reset when the app reloads. No payment is taken, no receipt email is actually sent, and the demo credentials are not production authentication.

## At a glance

| Item | Value |
| --- | --- |
| Framework | Expo SDK 57 (managed), React Native 0.86, React 19.2 |
| Navigation | `@react-navigation/native-stack`, single stack in `App.js` |
| Language | JavaScript (no TypeScript/typecheck) |
| Styling | React Native `StyleSheet`, shared theme in `src/theme.js` |
| Testing | Jest + `jest-expo`, 16 suites / 90 tests |
| Platforms | iOS, Android, web (Expo Go or simulator/emulator) |
| Backend | None — all services are local mocks |

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

The admin account locks after **five** incorrect passwords and can only be reset in memory (`resetAdminLoginAttempts`) or by reloading the app. The **Enterprise SSO** button on the admin screen is a placeholder and does nothing.

## Screen map

All routes are registered in `App.js` with `headerShown: false`; each screen renders the shared `ScreenLayout`.

| Route | Screen file | Purpose |
| --- | --- | --- |
| `Welcome` | `WelcomeScreen.js` | Choose Employee or Admin sign-in |
| `EmployeeLogin` | `EmployeeLoginScreen.js` | Employee sign-in with password visibility toggle |
| `AdminLogin` | `AdminLoginScreen.js` | Admin sign-in with five-attempt lockout |
| `EmployeeDashboard` | `EmployeeDashboard.js` | Stats, next show, schedule/events/account tabs |
| `EmployeeEvents` | `EmployeeEventsScreen.js` | All scheduled shows in date order |
| `BookingDateVenue` | `BookingDateVenueScreen.js` | Booking step 1 — date, time, venue, contact details |
| `BookingReview` | `BookingReviewScreen.js` | Booking step 2 — final review before submission |
| `BookingConflict` | `BookingConflictScreen.js` | Recovery when the chosen date was just taken |
| `BookingManage` | `BookingManageScreen.js` | View and cancel a show, releasing its date |
| `BookingSubmitted` | `BookingSubmittedScreen.js` | Booking step 3 — review-queue receipt |
| `DroneManifest` | `SerializedDroneManifestScreen.js` | Admin fleet registry with search |
| `Dashboard` | `DashboardScreen.js` | Client account shortcuts (booking, fees, settings) |
| `AccountSettings` | `AccountSettingsScreen.js` | Notification streams, language, time zone |
| `FeeReview` | `FeeReviewScreen.js` | Coverage/policy fees (OSPSA-340 preview) |
| `Checkout` | `PaymentCheckoutScreen.js` | Operations summary and Sprint 2 payment placeholder |

Flow overview:

```text
Welcome
├─ Employee Sign In → EmployeeLogin → EmployeeDashboard
│    ├─ + Schedule a show / SCHEDULE → BookingDateVenue → BookingReview → BookingSubmitted
│    │                                      ↑                    │
│    │                                      └──── BookingConflict ┘  (date was taken)
│    ├─ EVENTS → EmployeeEvents → BookingManage
│    └─ ACCOUNT → Dashboard → FeeReview → Checkout
│                          └→ AccountSettings
└─ Admin Sign In → AdminLogin → DroneManifest
```

The logo in the shared header calls `navigation.popToTop()`, returning to `Welcome`. Account Settings is the one screen that overrides it, sending the logo back to the employee dashboard.

## The booking flow

The wizard header (`BookingWizardProgress`) has three labels: **DATE & VENUE**, **REVIEW**, **REQUEST**. The current step uses the lime accent; earlier steps are plain text and later steps stay dim.

### Step 1 — Date & venue (`BookingDateVenueScreen`)

- Calendar opens on the first bookable month. **Nothing is selected** until a day is tapped, and shows need a **7-day lead time** (`MIN_BOOKING_LEAD_DAYS`). Sundays are bookable.
- **One show per day.** Dates already claimed by an active submission are red and disabled.
- 24 hourly time slots from `12:00 AM` to `11:00 PM`; the default is `8:00 PM`.
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

- Three-segment wizard header with **REQUEST** lit.
- Double-ring check badge, **BOOKING REQUEST RECEIVED** and the reminder that the show is **not confirmed yet**. These use the lime accent (`colors.accent`); cyan was removed from this page.
- Ticket card pulls live from the booking and submission:
  - reference top-left, e.g. `REQ-20261121-2000` (date + 24-hour time, built by `submissionReference`);
  - amber **PENDING REVIEW** pill top-right;
  - event title, scheduled date/time, time zone, drone count, duration and `Venue · City`.
- **WHAT HAPPENS NEXT** lists three steps. Step 1, “Venue & airspace review”, is active: lime number circle with a lime ring on a dark tint (`accentTint`) and a **gold** title that ties to the pending pill. Steps 2–3 stay dimmed with muted numbers.
- Footer: “A request receipt will be sent to kenneth.elliott@csus.edu” plus **→ View my requests** (to `EmployeeDashboard`) and **+ Schedule another show**.
- If there is no booking, the screen shows a “No request to show” recovery card.

### Conflict recovery (`BookingConflictScreen`)

When the chosen date was already claimed, the screen explains that shows run once per day and shows the exact unavailable slot (accepting ISO strings or separate date/time fields). It restores every cached event detail, marks it **● SAVED**, and offers **Choose another date** / **← Return to schedule**, both of which return to step 1 with `focusCalendar: true` and an inline “date no longer available” notice. Nothing needs to be retyped.

### Manage or cancel (`BookingManageScreen`)

Reached from the dashboard’s **Manage event** link or an events-list card. It shows reference, date, time, time zone, venue, address, fleet size and duration. **Cancel booking** asks for confirmation, then cancels the submission; the receipt state explains that the date is available again. Cancelled shows disappear from the dashboard/events list because the ledger only returns active submissions.

## Other screens

### Employee dashboard and events

- Dashboard greets “Welcome back, Kenneth”, shows **scheduled shows** / **in review** counts, a **+ Schedule a show** button, the next chronological show (reference, status, date, venue, manage link), a “Review your show brief” action, and a help row. Both counts start at `00` until a request is submitted.
- The bottom navigation is shared (`EmployeeBottomNav`): HOME, SCHEDULE, EVENTS, ACCOUNT.
- **Events** lists every active submission in date order with a pending/confirmed badge and a **Manage event** link. It has a dedicated empty state.
- The “show brief” and “contact coordinator” rows are visual placeholders.

### Admin fleet manifest

`SerializedDroneManifestScreen` is a static sample of six airframes with an airframe/RFID search, status badges, battery telemetry and a five-tab fleet bottom bar. **This is the only screen that still uses cyan** (`colors.cyan`); the rest of the app uses lime, gold, green and red. The header is hard-coded to `TOTAL: 120 UNITS` while only six rows are mocked.

### Client account and settings

`DashboardScreen` (“My Account”) has three shortcuts: schedule a show, review booking fees, and account settings.

`AccountSettingsScreen` renders four notification streams — email (on), push (off), show updates (on), billing (on) — plus a security/contractual email footnote, language (`English` default) and time-zone pickers, and Save/Cancel. Save calls `saveNotificationSettings` (500 ms mock) and shows a `Preferences saved` toast; failure shows an inline error. Cancel and the `< ACCOUNT` breadcrumb return to `Dashboard`. The saved time zone becomes the fallback for bookings when a postal code cannot be resolved.

### Fee review and checkout (OSPSA-340 preview)

- `FeeReviewScreen` calls `getBookingFees(1)` and renders loading, a retryable error, or **Commercial Airspace Coverage** with a **$450.00** policy premium, coverage toggle, carrier and period.
- **Proceed to Checkout** shows the Operations Summary. The five mock line items total **$4,674.00**; turning coverage off removes the $450 liability row and totals **$4,224.00**.
- Promo codes and split payment are explicitly preview-only and do not change the amount; neither calls a backend.
- **Continue to Payment Portal** shows “Payment screen coming in Sprint 2” via `Alert` (browser alert on web). No payment is processed.
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
| `768–1199` | tablet | 32 px | 1100 px |
| `1200+` | desktop | 48 px | 1280 px |

Tablet and desktop switch two-column cards (booking form/calendar, settings, fee/checkout), larger type and 56 px primary buttons. The synthetic web status bar appears only on phone-sized web views; native devices use the real system status bar. Orientation is enabled in `app.json`.

The shared `ScreenLayout` scroll view sets `keyboardShouldPersistTaps="handled"`, `automaticallyAdjustKeyboardInsets` on iOS and `keyboardDismissMode="on-drag"`, so focusing an input keeps it above the keyboard and dragging dismisses it.

## Data and mocks

Everything is session state; a reload clears it. Replace these modules with real API calls when a backend exists.

| Module | Stands in for | Behavior |
| --- | --- | --- |
| `services/bookingDraftService.js` | `POST /api/bookings` + draft cache | `DEFAULT_BOOKING_DRAFT`, venue validation, trimmed session records |
| `services/bookingConflictService.js` | Booking/date-lock API | One active show per date, references, conflict payloads, cancel releases the date |
| `services/settingsService.js` | `GET/PUT /api/clients/me/settings` | In-memory store, 500 ms save, failure flag |
| `services/feeService.js` | `GET /api/bookings/:id/fees` | 600 ms mock from `mockData.js`, failure flag |
| `services/employeeAuthService.js` | Employee auth | Local username/password table |
| `services/adminAuthService.js` | Admin auth | Local table, five-attempt lockout |
| `mockData.js` | Account/profile API and pickers | Request contact, fee payload, languages, time zones |

Other details:

- A submission reference is `REQ-YYYYMMDD-HHMM` in 24-hour time (e.g. `REQ-20261121-2000`). If the time cannot be parsed, it falls back to `REQ-YYYYMMDD`.
- Submitting the same draft twice is idempotent, so a double tap cannot lock the user out of their own request.
- Dates are exclusive per active show; cancelling frees the date for another request.
- `active` submissions are `pending`; cancelled records remain in memory but are hidden from lists.

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

Current results on `OSPSA-57-final-review-page` (25 October 2026):

- **90 tests across 16 suites pass** (`jest --runInBand`).
- `expo install --check` reports **Dependencies are up to date**.
- `expo export --platform all` succeeds and emits web, Android and iOS bundles.

| Test file | Covers |
| --- | --- |
| `fees.test.js` | Cents arithmetic, USD formatting, invalid input |
| `feeService.test.js` | Mock delay, simulated failure/retry, unknown booking, no mutation |
| `screens.test.js` | Fee review loading/error, checkout totals, coverage switch, promo/split, progress dividers, missing booking |
| `settings.test.js` | Notification defaults/toggles, pickers, save success/failure, cancel and breadcrumb routing, dashboard links |
| `settingsService.test.js` | Saved payload, delay, failure |
| `responsive.test.js` | Phone/tablet/desktop breakpoints, footer width |
| `employeeLogin.test.js` | Demo credentials, invalid credentials, password visibility, logo home |
| `adminLogin.test.js` | Five-attempt lockout and reset, inert SSO button |
| `employeeDashboard.test.js` | Dashboard content, bottom nav, submitted show, events routing |
| `employeeEvents.test.js` | Empty state, date ordering, manage routing |
| `bookingWizard.test.js` | Lead time/Sundays, empty initial selection, calendar paging, time zone from postal code, validation, draft save, review submission, conflict routing, booked-date blocking |
| `bookingConflict.test.js` | Backend slot parsing, conflict screen restore/routing, fallback draft, whole-date ledger, receipt content |
| `bookingCancellation.test.js` | Cancelling frees the date, confirmation flow, dashboard routing |
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
- **No payments.** Checkout stops at a Sprint 2 alert. Promo codes and split payment are visual only.
- **Static admin data.** The fleet manifest is six sample rows; the header total is hard-coded, and the fleet tabs do not navigate.
- **Placeholder actions.** Admin Enterprise SSO, “Review your show brief” and “Contact your show coordinator” have no behavior.
- **Device QA outstanding.** The iOS keyboard-inset behavior and native rendering were implemented but not exercised on a physical device in this environment. Verify on an iPhone in Expo Go.
- **Audit advisories.** `npm audit` reports **5 high-severity advisories** in the Expo CLI dependency chain (`node-forge`, `zod`). `npm audit fix --force` would downgrade Expo to 44, so it has deliberately not been applied; review upstream SDK-compatible fixes before release.
- **Desktop/web visual QA** has been done in a browser at phone, tablet and desktop widths, but not exhaustively on every screen.

## Git: branch structure and how to push

This checkout uses the remote `origin` → `https://github.com/JonathanDLee24/Orion-Skys-Smartphone-App.git`.

| Branch | Base | Contents |
| --- | --- | --- |
| `main` | `origin/main` | Published baseline |
| `OSPSA-56-confirmation-receipt-page` | `main` | Review-queue receipt and lime/gold status theme |
| `OSPSA-57-final-review-page` | `OSPSA-56` | Final review page, paper-plane submit icon, keyboard-safe form, docs and local connectivity/Expo fixes |

Because OSPSA-57 is stacked on OSPSA-56, pushing 57 also uploads the OSPSA-56 commits. Push **56 first**, then 57, and keep the pull requests in that order.

### Push both branches and open the PRs

```bash
# 1. Confirm the current branch and a clean working tree.
git status --short --branch
git log --oneline --decorate -6

# 2. Push the base branch first.
git push -u origin OSPSA-56-confirmation-receipt-page

# 3. Push the stacked branch.
git push -u origin OSPSA-57-final-review-page
```

No `git add -A` is needed at this point: the connectivity/Expo fix, this README and the paper-plane icon are already committed on `OSPSA-57`.

If GitHub asks for credentials, authenticate first (the `gh` CLI is installed but was not logged in in this checkout):

```bash
gh auth login
```

Create the pull requests (base matters because the branches are stacked):

```bash
gh pr create \
  --base main \
  --head OSPSA-56-confirmation-receipt-page \
  --title "OSPSA-56: confirmation receipt page" \
  --body "Rebuilds the booking confirmation as a review-queue receipt and replaces the cyan status styling with the lime/gold theme."

gh pr create \
  --base OSPSA-56-confirmation-receipt-page \
  --head OSPSA-57-final-review-page \
  --title "OSPSA-57: final review page" \
  --body "Rebuilds the final review step, removes the back link, adds the paper-plane submit icon, and makes the form keyboard-safe."
```

Without `gh`, open the compare pages in the browser:

- OSPSA-56 → `main`: `https://github.com/JonathanDLee24/Orion-Skys-Smartphone-App/compare/main...OSPSA-56-confirmation-receipt-page?expand=1`
- OSPSA-57 → `OSPSA-56`: `https://github.com/JonathanDLee24/Orion-Skys-Smartphone-App/compare/OSPSA-56-confirmation-receipt-page...OSPSA-57-final-review-page?expand=1`

Open PR 56 first, then PR 57 against the 56 branch. Do **not** target `main` with 57 before 56 merges, or the PR will show both tickets' commits. After 56 merges, retarget 57 to `main` if GitHub does not do it automatically.
