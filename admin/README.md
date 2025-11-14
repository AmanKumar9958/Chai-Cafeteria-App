<div align="center">
	<h1>Chai Cafeteria Admin Dashboard</h1>
	<p><strong>React (Vite) • Admin Order Management • JWT Auth</strong></p>
	<p>Secure back-office UI for monitoring and updating all customer orders.</p>
</div>

---

## Table of Contents
1. Overview & Features  
2. Tech Stack  
3. Directory Structure  
4. Environment Variables  
5. Setup & Development  
6. Authentication Flow (Admin JWT)  
7. Orders Page Functionality  
8. API Integration & Axios Interceptors  
9. Status Update Workflow  
10. Session Expiry Handling  
11. Deployment  
12. Security Notes  
13. Troubleshooting  
14. Roadmap / Enhancements  

---

## 1. Overview & Features
The admin dashboard allows authorized staff to:
- Log in using server-managed credentials (no client-stored password logic).
- View all customer orders (latest first), including item counts, payment method, coupon usage, discount, address, and placed timestamp.
- Update order status through predefined lifecycle stages.
- See applied discounts and coupon codes clearly (shows `N/A` when none).
- Auto-redirect to login when a session (JWT) expires (401 handling).

Design goals: minimal friction, fast status operations, secure separation from customer UI, clear data.

---

## 2. Tech Stack
| Area | Choice |
|------|--------|
| Build | Vite (React) |
| UI | React 18+/19 features (hooks) |
| Network | Axios instance with interceptors |
| Notifications | `react-hot-toast` |
| Auth | Admin JWT stored in `localStorage` (key: `adminToken`) |
| Styling | Utility classes (Tailwind-ready build pipeline assumed) |

---

## 3. Directory Structure (Simplified)
```
admin/
	src/
		api.js                # Axios instance (Authorization header + 401 handler)
		context/
			AuthContext.jsx     # Login/logout, isAuthenticated state
		pages/
			OrdersPage.jsx      # Primary admin UI for orders
		main.jsx / App.jsx    # Root React mount & routing (if applicable)
	index.html
	vite.config.*
	README.md
```

---

## 4. Environment Variables (`admin/.env`)
```
VITE_API_URL=https://<BACKEND_HOST>/api
```
*Backend admin credentials are **not** stored here.* They live only in backend env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`). The admin login request sends the entered credentials to the backend which validates and returns a signed JWT.

> If hosting behind the same domain (e.g. `/api` reverse proxy), you can set `VITE_API_URL=/api`.

---

## 5. Setup & Development
```bash
cd admin
npm install
npm run dev
```
Open the local dev URL (e.g. http://localhost:5173) and ensure backend is running & accessible at `VITE_API_URL`.

Production build:
```bash
npm run build
```
Preview the build:
```bash
npx serve dist
```

---

## 6. Authentication Flow (Admin JWT)
1. Admin enters username/password on login form.
2. POST `/api/admin/auth/login` with JSON credentials.
3. Backend validates against `ADMIN_USERNAME` / `ADMIN_PASSWORD` env values.
4. Backend returns `{ token }` (JWT payload includes `role: 'admin'`).
5. Token stored in `localStorage` as `adminToken`.
6. All subsequent requests attach `Authorization: Bearer <token>`.
7. On 401 (expired/invalid) → token cleared → redirect to `/login?reason=session-expired`.

No password hashing / multi-admin logic is implemented yet (see Roadmap).

---

## 7. Orders Page Functionality
Displayed per order:
- Order ID
- Number of items & total amount (fallback handling for variant fields)
- Payment method (or `N/A`)
- Coupon code + discount (shows `N/A` when absent)
- Customer name, phone, address fields, pincode
- Placed timestamp (formatted with `toLocaleString()`)
- Items list (name × qty)

Status can be changed via dropdown (select). After saving, a toast confirms and list refreshes.

---

## 8. API Integration & Axios Interceptors
`src/api.js` configures:
- Base URL from `VITE_API_URL`.
- Request interceptor: injects `Authorization: Bearer <adminToken>` if present.
- Response interceptor: on 401 → clears token → redirect to login with query param.

> Centralizing this avoids repeating headers & ensures uniform session handling.

---

## 9. Status Update Workflow
1. Admin selects new status from dropdown.
2. PUT `/api/admin/orders/:id` body `{ status }`.
3. Success toast → triggers reload (`GET /api/admin/orders`).
4. Any error yields toast with fallback message.

Statuses supported (current lifecycle): `Order Placed`, `Packing`, `Shipped`, `Out for delivery`, `Delivered` (and `Cancelled` server side if implemented later).

---

## 10. Session Expiry Handling
- 401 intercept triggers:
	- `localStorage.removeItem('adminToken')`.
	- Browser redirected to `/login?reason=session-expired`.
- Login page can optionally read the `reason` query to display a contextual message (add if desired).

---

## 11. Deployment
Static hosting options:
- Netlify / Vercel / Render static site / GitHub Pages (with SPA fallback).
- Ensure `VITE_API_URL` points to production backend (e.g. `https://api.yourdomain.com/api`).
- If served from same origin behind reverse proxy, configure rewrite so `/api` routes map to backend service.

Cache busting: Vite includes content hashes; re‑deploy on backend auth changes (token format unaffected but recommended).

---

## 12. Security Notes
| Aspect | Current | Recommendation |
|--------|---------|----------------|
| Admin creds | Single env pair | Move to DB + hashed secrets + rotation for scale |
| Token storage | localStorage | Consider short expiry + refresh mechanism if needed |
| Role check | `role==='admin'` in JWT | Extend claims / RBAC when more roles introduced |
| Network | Plain HTTPS fetch | Optionally add retry & exponential backoff |
| Input validation | Minimal | Add form validation (Zod / Yup) for future forms |

---

## 13. Troubleshooting
| Symptom | Cause | Resolution |
|---------|-------|------------|
| Orders list empty | 401 redirect occurred silently | Re-login; check token presence |
| Always 401 | Backend env creds mismatch | Verify `ADMIN_USERNAME/PASSWORD` on server |
| Status not updating | PUT blocked / CORS | Inspect network tab; ensure backend CORS allows origin |
| Wrong totals | Legacy orders w/ missing fields | Confirm backend normalization/migration |
| Stale list after update | Missing reload | Ensure promise `.then(() => load())` present |

---

## 14. Roadmap / Enhancements
- Filter & search (by status, date range, payment method).
- Pagination / infinite scroll for large order volumes.
- Real-time updates (WebSocket / SSE) for new orders.
- Multi-admin user management & activity audit logs.
- Export: CSV / PDF daily sales report.
- Dark mode & accessibility improvements.
- Toast unification with shared component library (if web + mobile convergence desired).

---

## Quick Start (Copy/Paste)
```bash
cd admin
npm install
echo "VITE_API_URL=https://your-backend-domain/api" > .env
npm run dev
```
Login with credentials configured in backend `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

---

## License
Internal / Private (add an OSS license if distributing publicly).

## Maintainer
Chai Cafeteria Engineering Team

> For full platform documentation (mobile + backend) see root `readme.md`.
