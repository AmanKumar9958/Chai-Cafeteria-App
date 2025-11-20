<div align="center">
   <h1>Chai Cafeteria Mobile App (Frontend)</h1>
   <p><strong>Expo • React Native • expo-router • Razorpay • Notifications</strong></p>
   <p>Customer‑facing mobile interface for browsing menu, placing orders, and tracking status.</p>
</div>

---

## Table of Contents
1. Overview & Feature Summary  
2. Tech Stack  
3. Directory Structure  
4. Environment Variables  
5. Installation & Running (Dev)  
6. Build (EAS)  
7. Authentication Flow  
8. Cart & Storage Model  
9. Orders & Status Progress  
10. Payments (Razorpay Integration)  
11. Payment & Delivery Rules  
12. Notifications (Local & Optional Remote)  
13. UI/UX Conventions (Toasts, Skeletons, Images)  
14. Reordering Logic  
15. Troubleshooting  
16. Scripts & Useful Commands  
17. Roadmap / Enhancements  

---

## 1. Overview & Feature Summary
This mobile app connects to the Chai Cafeteria backend API to authenticate users, display the menu, manage a per‑user cart, collect delivery or pickup details, process payments (Razorpay), show order tracking status, and enable reordering of delivered items. Daily reminder notifications (local) and optional remote push scaffolding are included.

**Highlights**
- Per‑user persistent cart (isolated by user ID / email) with guest migration.
- Razorpay payment flow (create → present checkout → verify signature → confirm order).
- Distance-based restrictions have been removed; COD can be available for delivery regardless of distance (subject to business policy).
- Delivery vs Pickup logic toggling available payment methods.
- Order status visualization & progress bar.
- Reorder delivered items (batch add to cart).
- Skeleton loaders & cached images (expo-image).
- Styled, top‑position toast notifications.
- Local scheduled notifications (11:00 & 18:00 by default) + optional one‑off debug notification.

---

## 2. Tech Stack
| Area | Library / Tool |
|------|----------------|
| Core | React Native (Expo SDK), React 19 |
| Routing | `expo-router` (file-based) |
| State / Context | Custom AuthContext & CartContext |
| Images | `expo-image` (caching, fade transitions) |
| Styling | Tailwind via NativeWind + custom colors |
| Notifications | `expo-notifications`, optional remote push token registration |
| Payments | Razorpay checkout (React Native wrapper) via backend create/verify endpoints |
| Feedback | `react-native-toast-message` (custom theming, top placement) |


---

## 3. Directory Structure (Key Parts)
```
frontend/
   app/
      _layout.jsx           # Root layout + toast provider
      (tabs)/               # Tabbed screens: home, menu, orders, profile
      checkout.jsx          # Checkout & payment orchestration
      login.jsx / register.jsx / verify-otp.jsx
   components/
      Skeleton.jsx          # Pulsing skeleton placeholder
      ImageCarousel.jsx     # (If implemented) carousel w/ expo-image
   context/
      AuthContext.jsx       # JWT auth, token verification, user state
      CartContext.jsx       # Per-user cart logic & persistence
   utils/
      notifications.js      # Local/remote notification helpers
   assets/                 # Images & static assets
   global.css / tailwind.config.js
```

---

## 4. Environment Variables (`frontend/.env`)
```
EXPO_PUBLIC_API_URL=https://<HOST>/api        # Must end with /api
EXPO_PUBLIC_RAZORPAY_KEY_ID=<rzp_public_key>
EXPO_PUBLIC_RAZORPAY_CREATE_PATH=/payments/razorpay/create-order   # optional override
EXPO_PUBLIC_RAZORPAY_VERIFY_PATH=/payments/razorpay/verify         # optional override
EXPO_PUBLIC_ENABLE_REMOTE_PUSH=false          # true => attempt push token registration
EXPO_PUBLIC_NOTIFICATIONS_DEBUG=false         # true => schedule one-off local test notification

```
> Changing env values requires restarting the Expo process (`npx expo start`).

---

## 5. Installation & Running (Development)
```bash
cd frontend
npm install
npx expo start
```
Open on device with Expo Go (limited) or build a **development build** (recommended for Razorpay module & notifications).

**Development build (EAS)**
```bash
eas build -p android --profile development
```

Ensure the device and backend host are on the same network (use LAN IP in `EXPO_PUBLIC_API_URL`).

---

## 6. Build (Preview / Production)
Preview build for testing native modules:
```bash
eas build -p android --profile preview
```
Production (release) build:
```bash
eas build -p android --profile production
```
Set env vars via EAS Secrets for CI builds.

---

## 7. Authentication Flow
1. User logs in → backend returns JWT.
2. Token stored (secure async storage abstraction) & verified on startup (`/auth/me` style check).
3. Invalid token → cleared; user routed to login.
4. Every protected API call attaches `Authorization: Bearer <token>`.
5. Logout clears token + cart user scope.

---

## 8. Cart & Storage Model
- Key format: `cart_<userKey>` (userKey = user._id || email || fallback).
- On first login: migrate from legacy `cart_guest` if present.
- Items store: id, name, price, qty, image, category.
- Reorder (from delivered order) batch‑adds items with existing pricing.

---

## 9. Orders & Status Progress
Displayed statuses: `Order Placed → Packing → Shipped → Out for delivery → Delivered`.
Progress bar animates to the index of the current status.
Delivered orders expose a **Reorder** button.
Date/time displayed using `createdAt.toLocaleString()`.

---

## 10. Payments (Razorpay Integration)
Flow:
1. Client computes payable amount (paise) & requests `POST /payments/razorpay/create-order`.
2. Receives `{ orderId }` & constructs Razorpay options (key, amount, currency, order_id, metadata).
3. Opens Razorpay checkout (React Native module) → user pays.
4. Receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
5. Sends these to verification endpoint (`/payments/razorpay/verify`).
6. On success: places backend order + shows success toast.

Failure handling: signature mismatch or cancellation shows error toast; order not persisted.

---

## 11. Payment & Delivery Rules
Distance/location checks have been removed from the app. Delivery orders may use either COD or Online Payment (business can still choose to restrict COD for Pickup if desired in the UI).

---

## 12. Notifications
| Type | Default | Details |
|------|---------|---------|
| Local scheduled | 11:00 & 18:00 | Rescheduled every login; uses `scheduleRegularNotifications()` |
| Debug one-off | 10s post-login (if enabled) | Toggle via `EXPO_PUBLIC_NOTIFICATIONS_DEBUG` |
| Remote push (optional) | Disabled by default | Requires enabling env + backend token endpoint |
| Foreground toast | Any notification received while app open | Shows "New update" info toast |

Permissions: Android 13+ & iOS require runtime permission (handled in `notifications.js`).

---

## 13. UI/UX Conventions
| Area | Convention |
|------|-----------|
| Toasts | Always top-position; success (green), error (red), info (blue) custom components |
| Images | `expo-image` with caching & fade transition |
| Placeholders | Pulsing `Skeleton` component while loading images/lists |
| Empty states | Flaticon placeholder icons for Orders/Menu with call-to-action |
| Styling | Tailwind utility classes + custom color palette (chai-* tokens) |

---

## 14. Reordering Logic
Delivered order → Tap Reorder → Items mapped back into cart (keeping original name/price/qty). Adds toast confirmation and navigates to cart if desired. Deduping can be added (currently naive additive merge if context implements it that way).

---

## 15. Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| No notifications | Permission denied / debug flag off | Allow permission; set debug env to test |
| Images missing (APK) | Using http:// instead of https:// | Ensure HTTPS image URLs |
| Razorpay modal not opening | Dev build / missing native module | Use EAS dev/preview build, not Expo Go |
| Orders list empty | Token invalid / backend scoping | Relogin; inspect network tab; verify API URL |

| Scheduled notifications duplicate | Old schedule left | App code cancels existing; reinstall if persists |

---

## 16. Scripts & Useful Commands
```bash
npx expo start                 # Start dev server
eas build -p android --profile preview   # Preview build
eas build -p android --profile production # Release build
npm run lint                   # (If lint script added)
```

One-off test notification (after login):
Set `EXPO_PUBLIC_NOTIFICATIONS_DEBUG=true` then rebuild/run.

---

## 17. Roadmap / Enhancements
- UI toggle for enabling/disabling daily reminders.
- Add order status change push notifications (remote) once backend token storage is finalized.
- Integrate deep linking from push to specific order detail.
- In-app receipt & invoice PDF/print export.
- Multi-coupon / loyalty points integration.

---

## License
Internal / Private (add license if open sourcing later).

---

## Maintainer
Chai Cafeteria Engineering Team

---

> For backend & admin details see the root `readme.md` in the repository.
