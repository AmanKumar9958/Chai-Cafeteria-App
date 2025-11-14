<div align="center">
	<h1>Chai Cafeteria Platform</h1>
	<p><strong>Mobile App (Expo / React Native) · Backend API (Node.js / Express / MongoDB) · Admin Dashboard (React / Vite)</strong></p>
	<p>End‑to‑end ordering, cart, payments (Razorpay), notifications, and admin order management.</p>
</div>

---

## Table of Contents
1. Overview & Features  
2. Architecture  
3. Tech Stack  
4. Project Structure  
5. Environment Variables  
6. Backend (API)  
7. Mobile App (Frontend)  
8. Admin Dashboard  
9. Payments (Razorpay Flow)  
10. Orders & Cart Logic  
11. Notifications (Local & Push)  
12. Security & Auth  
13. Running Locally (Dev)  
14. Building & Deployment  
15. API Endpoint Reference (Summary)  
16. Data Models (Summary)  
17. Troubleshooting  
18. Future Enhancements  

---

## 1. Overview & Features

The Chai Cafeteria platform enables customers to browse a menu, add items to a per‑user cart, place pickup or delivery orders (with distance and payment rules), and pay online using Razorpay. Admins can log in using a secure JWT‑based admin flow to view and update all orders. The mobile app shows order progress, supports (optional) push & scheduled local notifications, and stores carts uniquely per authenticated user.

### Key Features
- User authentication with JWT (mobile) & admin JWT (separate credentials).
- Per‑user cart isolation with migration from guest cart.
- Delivery vs. pickup logic & distance rule (COD blocked beyond 5 km, advance payment required).
- Razorpay integration: create order & signature verification endpoints.
- Order status tracking: Order Placed → Packing → Shipped → Out for delivery → Delivered.
- Admin order dashboard: list & update statuses, coupon & totals display.
- Daily local reminder notifications (configurable) + optional remote push scaffolding.
- Responsive UI skeleton loaders, image caching (expo-image) & fallback placeholders.
- Secure scoping: users only see their own orders (server + defensive client filtering).
- Top‑positioned styled toast notifications (uniform across app).

---

## 2. Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                  │
│  Auth (JWT)  |  Cart Context  |  Orders  |  Payments  │
│        |                 REST API (HTTPS)              │
└────────┼──────────────────────────────────────────────┘
				 │
				 v
┌────────────────────────────────────────────────────────┐
│                Backend API (Express)                  │
│ Auth / Users / Menu / Orders / Coupons / Payments     │
│  Razorpay HMAC verify | Distance logic | JWT middleware│
└────────┬──────────────────────────────────────────────┘
				 │ (admin JWT)
				 v
┌────────────────────────────────────────────────────────┐
│                 Admin Dashboard (Vite)                 │
│ Login → JWT (role=admin) → Manage / Update Orders      │
└────────────────────────────────────────────────────────┘
```

MongoDB stores users, menu items, categories, coupons, orders (with items & status timeline). Razorpay orders & payment signatures are verified server‑side.

---

## 3. Tech Stack

| Layer        | Technologies |
|--------------|--------------|
| Mobile       | Expo (React Native), expo-router, expo-image, react-native-toast-message, expo-notifications |
| Backend      | Node.js, Express, Mongoose, JWT, Razorpay SDK, dotenv, crypto |
| Admin        | React (Vite), axios, react-hot-toast |
| Build / Dev  | EAS (Android APK), Render (example hosting), MongoDB Atlas |
| Styling      | Tailwind (NativeWind), custom design tokens |

---

## 4. Project Structure

```
root/
	backend/            # Express API
	frontend/           # Expo mobile app
	admin/              # Vite React admin dashboard
	readme.md
```

Key backend folders (implicit / typical): `models/`, `routes/`, `controllers/`, `middleware/`.

---

## 5. Environment Variables

### Backend (`backend/.env`)
```
MONGO_URI=...                # MongoDB connection
JWT_SECRET=...               # JWT signing key for user tokens
RAZORPAY_KEY_ID=...          # Razorpay public key
RAZORPAY_KEY_SECRET=...      # Razorpay secret key
ADMIN_USERNAME=...           # Admin login username
ADMIN_PASSWORD=...           # Admin login password
PORT=5000                    # Optional custom port
```

### Frontend Mobile (`frontend/.env`)
```
EXPO_PUBLIC_API_URL=https://<HOST>/api        # Must end with /api
EXPO_PUBLIC_RAZORPAY_KEY_ID=<rzp_public_key>
EXPO_PUBLIC_RAZORPAY_CREATE_PATH=/payments/razorpay/create-order  # (optional override)
EXPO_PUBLIC_RAZORPAY_VERIFY_PATH=/payments/razorpay/verify        # (optional override)
EXPO_PUBLIC_ENABLE_REMOTE_PUSH=false          # true to try Expo push token registration
EXPO_PUBLIC_NOTIFICATIONS_DEBUG=false         # true schedules a 10s test notification after login
EXPO_PUBLIC_DISABLE_DISTANCE_CHECK=false      # true bypasses distance rule (dev only)
EXPO_PUBLIC_CAFE_LAT=<latitude>               # for distance calculations
EXPO_PUBLIC_CAFE_LNG=<longitude>
```

### Admin (`admin/.env`)
```
VITE_API_URL=https://<HOST>/api
# Admin login now happens via backend credentials (username/password) returning an admin JWT.
```

> NOTE: Former client‑side admin credential vars (VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD) are deprecated in favor of secure server‑side validation.

---

## 6. Backend (API)

### Main Responsibilities
- User auth (JWT issuance & verification middleware).
- Menu, categories, coupons retrieval.
- Order creation (binding authenticated user automatically) & scoping queries by user.
- Payment order creation + signature verification (Razorpay).
- Admin routes (prefixed `/api/admin`) secured by admin JWT (role=admin).
- JSON 404 fallback & health endpoint `/api/health`.

### Notable Middleware
- `auth` (verifies user JWT → attaches `req.user`).
- `adminJwt` (verifies admin JWT with `role=admin`).

### Payment Flow
1. Mobile calls `POST /api/payments/razorpay/create-order` with amount in paise.
2. Backend creates Razorpay order and returns `orderId` + amount.
3. Mobile opens Razorpay checkout using public key + returned order id.
4. Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
5. Mobile posts these to `/api/payments/razorpay/verify`.
6. Backend HMAC verifies signature: `hmacSHA256(order_id|payment_id, RAZORPAY_KEY_SECRET)`.

### Admin Authentication
POST `/api/admin/auth/login` with JSON `{ username, password }` → returns `{ token }` (12h expiry, role=admin). Use `Authorization: Bearer <token>` for subsequent admin requests.

---

## 7. Mobile App (Frontend / Expo)

### Highlights
- expo-router navigation with tab layout.
- Context providers: `AuthContext`, `CartContext` (per‑user storage key, migration from guest cart).
- Orders screen: status progress bar, reorder option after delivery, secure filtering.
- Checkout logic: distance checks; COD disabled > 5 km; pickup may follow different payment rule; Razorpay integration.
- Styled top toasts for success/error/info.
- Image performance via `expo-image` + skeleton loaders.
- Daily notification scheduling + optional debug test notification.

### Notifications
Local (default 11:00 & 18:00) scheduled after login. Optional remote push if enabled & backend token storage implemented.

### Reordering
Delivered orders can be re-added to the cart via a single tap (batch add items).

---

## 8. Admin Dashboard (Vite React)

### Features
- Login form → calls backend admin login → stores admin JWT in `localStorage` (`adminToken`).
- Orders table/cards: shows items count, payment method, coupon, discount, placed timestamp, status dropdown.
- Status update triggers PUT `/api/admin/orders/:id` and refreshes list.
- 401 auto‑redirect (session expired) handled by axios response interceptor.

---

## 9. Payments (Razorpay Flow)

Mobile configuration uses `EXPO_PUBLIC_RAZORPAY_KEY_ID` (public key). Backend holds secrets and performs server‑side verification. Failed signature → treated as unpaid.

> Amounts are always passed in paise (integer). Validate & sanitize inputs to avoid mismatch.

---

## 10. Orders & Cart Logic

| Concern | Implementation |
|---------|----------------|
| User scope | Backend queries `Order.find({ user: userId })`; client also filters defensively. |
| Cart storage | Key: `cart_<userKey>` where userKey = user._id/email; migrates from legacy `cart_guest`. |
| Distance rule | If >5 km → show info toast; COD disabled; require online payment. |
| Delivery vs Pickup | Payment method constraints adjusted (pickup can allow COD within policy). |
| Totals | Server & client compute; client sanitizes numeric fields before display. |
| Status progression | Visual progress bar (five steps) + admin manual updates. |

---

## 11. Notifications (Local & Push)

| Type | Default | Notes |
|------|---------|-------|
| Local scheduled | 11:00 & 18:00 daily | Cleared & re‑scheduled on login. |
| Debug one‑off | 10s after login | Enabled with `EXPO_PUBLIC_NOTIFICATIONS_DEBUG=true`. |
| Remote push | Optional | Requires enabling remote push env + backend token endpoint + Expo push service. |
| Foreground toast | On notification receive | Displays “New update” toast if app in foreground. |

To add remote pushes: implement `/api/users/push-token` & a sender using Expo Push API.

---

## 12. Security & Auth

| Area | Approach |
|------|----------|
| User auth | JWT signed with `JWT_SECRET`; token verified on every protected route. |
| Admin auth | Separate credentials → admin JWT with `role=admin`. |
| Order ownership | Enforced server-side; client filters extra. |
| Payment integrity | Razorpay signature verification (HMAC). |
| CORS | Currently permissive (cors()); restrict domains in production. |
| Secrets | Never commit real Razorpay secret keys; use env vars. |

---

## 13. Running Locally

### Backend
```powershell
cd backend
npm install
npm start   # or: nodemon server.js
```
Default: http://localhost:5000 (API root) → /api/* mounted.

### Admin
```powershell
cd admin
npm install
npm run dev
```
Set `VITE_API_URL=http://localhost:5000/api` for local.

### Mobile (Expo)
```powershell
cd frontend
npm install
npx expo start --clear
```
Ensure `EXPO_PUBLIC_API_URL=http://<LAN_IP>:5000/api` for device testing; device & PC must share network.

---

## 14. Building & Deployment

### Backend (Render / Any Node Host)
- Provide `MONGO_URI`, `JWT_SECRET`, Razorpay keys, admin credentials.
- Add health check `/api/health`.

### Mobile (EAS Build)
```powershell
cd frontend
eas build -p android --profile preview
```
Set env variables in EAS (Secrets) for API URL & keys. Generate release / submit to Play Store optionally.

### Admin
- Deploy static bundle (Vercel/Netlify) with `VITE_API_URL` env referencing backend `/api`.

---

## 15. API Endpoint Reference (Summary)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | — | Health check |
| POST | /api/auth/login | — | User login (assumed implementation) |
| GET | /api/menu/* | — | Menu & categories |
| GET | /api/orders | User JWT | List authenticated user orders |
| POST | /api/orders | User JWT | Create order (user inferred) |
| PUT | /api/orders/:id | User JWT | Update user order (if allowed) |
| POST | /api/payments/razorpay/create-order | User JWT | Create Razorpay order |
| POST | /api/payments/razorpay/verify | User JWT | Verify signature |
| POST | /api/admin/auth/login | — | Admin JWT issuance |
| GET | /api/admin/orders | Admin JWT | List all orders |
| PUT | /api/admin/orders/:id | Admin JWT | Update order status |

> Exact additional routes (e.g., coupons) follow similar patterns.

---

## 16. Data Models (Simplified)

### Order
```js
{
	user: ObjectId(User),
	items: [{ item: ObjectId(Item), name, price, qty, image, category }],
	total, subtotal, deliveryFee, discount, couponCode,
	orderType: 'Pickup' | 'Delivery',
	paymentMethod, status,
	customerName, phone, address1, address2, landmark, pincode, notes,
	createdAt, updatedAt
}
```

### (Other models typical): User, Item, Category, Coupon – each referencing MongoDB documents for menu & promotions.

---

## 17. Troubleshooting

| Issue | Possible Cause | Fix |
|-------|----------------|-----|
| No notifications | Permission not granted / debug flag off | Enable permission; set `EXPO_PUBLIC_NOTIFICATIONS_DEBUG=true` for test. |
| Orders empty on mobile | Auth token invalid / backend scoping | Check login flow & network logs. |
| Razorpay checkout fails | Incorrect key or amount mismatch | Verify env vars & amount in paise. |
| Admin 401 loop | Expired admin JWT | Re-login; check response interceptor. |
| Images not loading (APK) | HTTP (cleartext) URLs | Use HTTPS or host securely. |

---

## 18. Future Enhancements
- Remote push for order status changes.
- User notification settings UI (toggle daily reminders).
- Order analytics dashboard (daily sales, cancellations, distance distribution).
- Coupon management in admin UI.
- Automated tests (Jest for backend / Detox or Playwright for app / admin). 

---

## Quick Payment Endpoint Verification (PowerShell)
```powershell
$host = "<HOST>"  # e.g., chai-cafeteria-app.onrender.com
Invoke-RestMethod -Uri "https://$host/api/payments/razorpay/create-order" -Method Post -ContentType 'application/json' -Body '{"amount":12345,"currency":"INR","receipt":"rcpt_test"}'
```
Expected JSON: `{ "orderId": "order_...", "amount": 12345, "currency": "INR" }`.

---

## License
Internal / Private (add an explicit license if you intend to open source).

---

## Maintainer
Chai Cafeteria Engineering – Contributions & issue reports welcome.

---

> Have questions or want to extend a module? Open an issue or add a new section here.


