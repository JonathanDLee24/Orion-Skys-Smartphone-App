# Orion Skys — Client payments

Frontend-only implementation of **OSPSA-340**, redesigned to match the supplied insurance and payment-checkout screenshots. The photo-based amounts and labels supersede the initial two-fee Jira mock at the user's request. Built with managed Expo SDK 57, JavaScript, React Navigation native stack, and React Native StyleSheet. No backend, database, Stripe, secrets, or real payments.

A **Client Dashboard** home screen and a **Client Account Settings** screen have been added. Settings covers the four notification streams, the email-only disclaimer, language and time-zone pickers, and Save/Cancel actions. It is reachable from the `◈ ACCOUNT` shortcut in the shared header on the dashboard, fee review, and checkout screens.

## Install and run

Requires Node.js **22.13 or newer** and npm. From this folder:

```bash
npm install
npx expo start
```

Scan the QR code using a compatible Expo Go app, or use `a` for an Android emulator and `i` for an iOS simulator (macOS required for iOS). Expo Go must support SDK 57.

For the web preview:

```bash
npx expo start --web
```

The layout uses SafeAreaView from react-native-safe-area-context, a scrollable content area, and a pinned bottom action. Layout updates live using `useWindowDimensions`:

- **Phone (<768px):** full-width single-column cards, compact reference typography, full-width action.
- **Tablet / iPad (768–1199px):** two-column policy and checkout layouts, larger text/cards, 32px gutters, and a right-aligned action. Content fills the available width up to 1100px.
- **Desktop (1200px+):** two-column workspace up to 1280px wide, 48px gutters, larger headings and 56px primary buttons.

Long values wrap without horizontal overflow, and content scrolls when height is limited. Portrait and landscape orientation are enabled. The reference-style status bar appears only on phone-sized web views; larger views show the Orion Skys brand header, and native devices use their real system status bar.

## Tests and checks

```bash
npm test
npm test -- --runInBand
npm run check
npx expo export --platform all
```

Jest uses jest-expo. Tests cover one/two/zero/large fee totals; USD formatting; integer safety; the delayed mock, failure and retry; screen loading; navigation data; the checkout alert; empty fees; and missing booking data. Settings tests cover the default toggle states and helper copy, toggle flipping, expansion and selection for both pickers, the saved payload and success toast, the failed-save error, Cancel/breadcrumb routing to the dashboard, and the dashboard quick links. This JavaScript project has no TypeScript/typecheck configuration. Expo dependency validation and native/web bundling are used alongside the tests.

## Flow and mocked data

The app opens on **Client Dashboard** (`Dashboard`). It shows the active booking and two quick links: **Review booking fees** routes to `FeeReview` and **Account settings** routes to `AccountSettings`. The `◈ ACCOUNT` header shortcut opens `AccountSettings` from any of those screens.

**Account Settings** renders the four notification toggles from `defaultNotificationSettings` — email (on), push (off), show updates (on), billing (on) — plus the static disclaimer, an English-default language picker, and a Singapore · SGT (UTC+8) default time-zone picker. `Save preferences` calls the mock `saveNotificationSettings` and, on success, shows a `Preferences saved` toast; Cancel and the `< ACCOUNT` breadcrumb both return to `Dashboard` without calling the service. Toggles animate between cyan (on) and border-grey (off), and each picker expands into a scrollable overlay list. The settings screen has no phase, so its progress divider is hidden.

The fee-review header divider is a four-segment progress indicator: coverage is phase 3 of 4 and checkout is phase 4 of 4. Arrow back links sit below the divider. Checkout returns to coverage; coverage's Back to Previous Step currently shows “Previous page coming soon” until the earlier page is developed.

`FeeReview` calls `getBookingFees(1)` on mount. It displays loading, a retryable error, or **Commercial Airspace Coverage** with a **$450.00** policy premium, coverage switch, carrier and period details. **Proceed to Checkout** passes the booking to `Checkout`, showing **Operations Summary**. The five reference line items sum to **Grand Total $4,674.00** (125000 + 250000 + 30000 + 45000 + 17400 cents). Switching coverage off removes the $450 liability item, making the checkout total $4,224.00. Empty fees produce a $0.00 total and disable checkout; missing or invalid booking data shows a recovery action.

The promo input and Apply button display explicit preview-only feedback; no discount is invented. Split Payment toggles a local selection only and does not change the amount due. Neither control calls a backend. The screenshot's tax is a fixed mock amount, not a live tax calculation.

**Continue to Payment Portal** displays **“Payment screen coming in Sprint 2”** using native Alert or the browser alert on web. It does not process payment. Checkout uses navigation data synchronously, so it needs no separate fetching/loading state.

All monetary values and totals are non-negative safe integer cents. Formatting splits dollars and remainder cents, avoiding floating-point currency arithmetic. Large dollar values use US grouping separators.

Data is mocked until **GET /api/bookings/:id/fees** exists. The service waits approximately 600ms and returns a fresh copy of this API-shaped payload:

```json
{
  "id": 1,
  "name": "Neon Lights Festival",
  "policy": {
    "premiumCents": 45000,
    "carrier": "Lloyd's Sky Aviation",
    "period": "24 Hours (OCT 24, 2026)"
  },
  "fees": [
    { "type": "Show Entry Fee", "amountCents": 125000 },
    { "type": "Logistics Security LZ Deposit", "amountCents": 250000, "refundable": true },
    { "type": "Per-Drone Vol. Surcharge (250)", "amountCents": 30000 },
    { "type": "Aviation Airspace Liability", "amountCents": 45000 },
    { "type": "State Sales Tax (8.7%)", "amountCents": 17400, "tax": true }
  ]
}
```

### Simulate a request failure

Set `feeServiceConfig.simulateFailure` to `true` in `src/services/feeService.js`, reload, and press Try again. Set it back to `false` to restore success. The settings save uses the same pattern via `settingsServiceConfig.simulateFailure` in `src/services/settingsService.js`. Both defaults read optional public environment flags:

```bash
EXPO_PUBLIC_SIMULATE_FEE_FAILURE=true npx expo start --web
EXPO_PUBLIC_SIMULATE_SETTINGS_FAILURE=true npx expo start --web
```

That command uses Bash/Git Bash. In PowerShell:

```powershell
$env:EXPO_PUBLIC_SIMULATE_FEE_FAILURE = "true"
npx expo start --web
```

Stop the server, unset the environment variable, and restart to restore normal behavior. This flag is not a secret. Do not place any secrets in Expo public environment variables.

## Folder structure

```text
App.js                              NavigationContainer and native stack
app.json                            Expo and Metro web configuration
package.json / package-lock.json    Dependencies, scripts, Jest preset
src/
  theme.js                          Colors, spacing, typography
  mockData.js                       API-shaped mock booking and settings defaults
  utils/fees.js                     Pure cents arithmetic and USD formatting
  services/feeService.js             Delayed mock with failure flag
  services/settingsService.js        Delayed mock settings save with failure flag
  components/
    FeeRow.js                       Label/amount line item
    PrimaryButton.js                Disabled/loading cyan button
    ScreenLayout.js                 Shared safe-area frame, header shortcut, styles
    ToggleSwitch.js                 Animated cyan/grey notification switch
    DropdownSelect.js               Expanding scrollable picker
    Toast.js                        Auto-dismissing success toast
  screens/
    DashboardScreen.js              Client home with quick links
    FeeReviewScreen.js              Async fee review and retry
    PaymentCheckoutScreen.js        Summary, total, and Sprint 2 placeholder
    AccountSettingsScreen.js        Notifications, language, time zone, save/cancel
__tests__/
  fees.test.js                      Fee utilities
  feeService.test.js                Mock service
  screens.test.js                   Screen states and actions
  settings.test.js                  Settings defaults, toggles, pickers, save/cancel, dashboard
  settingsService.test.js           Mock settings save
  responsive.test.js                Phone/tablet/desktop breakpoint boundaries
.gitignore                          Dependencies, generated files, env and OS files
README.md
```

## Verification and known limitations

- All 42 Jest tests pass, including coverage-switch, promo-input, split-payment, settings and dashboard tests; Expo reports compatible dependency versions.
- Production bundles export successfully for web, Android, and iOS.
- The new settings screen, dashboard links, toggle flipping, both expanding pickers, the saved payload/throwaway success toast and the failed-save error are covered by the Jest suite. Native device and visual browser QA for these new screens has not been performed in this environment; the toggle animation and picker overlay styling should be checked on a device.
- The redesigned policy and checkout layouts were visually checked in the running browser. Checkout navigation, promo feedback and split-payment selection were exercised. Adaptive layouts were checked at phone (320×568), iPad portrait (768×1024 and 834×1194), tablet landscape (1024×768), and desktop (1440×900) sizes. The browser switches from stacked columns to side-by-side cards at the tablet breakpoint without horizontal overflow. The initial failure/retry UI and exact Sprint 2 alert were browser-tested; their behavior remains covered by the updated Jest suite.
- Native device/emulator execution has not been checked. Bundling and mocked native screen tests are not substitutes for device QA.
- npm audit currently reports **57 dependency advisories (12 moderate, 45 high)** in this SDK/test-tool dependency graph. Suggested automated fixes include incompatible major versions. No forced upgrade or audit suppression has been applied; review SDK-compatible upstream fixes before release.

## First Git commit

The repository is initialized but nothing is staged or committed. From this project folder, review and commit only the project files:

```bash
git status --short
git add .gitignore App.js app.json package.json package-lock.json README.md src __tests__
git diff --cached --stat
git commit -m "OSPSA-340: add fee review and checkout screens"
```

If Git asks for author identity, configure your own name and email locally before committing. Generated output, node_modules, .expo, .env files, logs, common OS files, and .freebuff metadata are ignored. No remote is configured and nothing has been pushed.
