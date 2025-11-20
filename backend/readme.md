<div align="center">
	<h1>Chai Cafeteria Backend API</h1>
	<p><strong>Node.js • Express • MongoDB (Mongoose) • JWT • Razorpay</strong></p>
	<p>Secure REST API powering the Chai Cafeteria mobile app & admin dashboard.</p>
</div>

---

## Table of Contents
1. Overview & Responsibilities  
2. Architecture & Flow  
3. Tech Stack  
4. Directory Layout  
5. Environment Variables  
6. Setup & Running Locally  
7. Authentication (Users & Admin)  
8. Payments (Razorpay Integration)  
9. Orders Domain Logic  
10. Notifications Support (Token Endpoint – optional)  
11. Security Hardening Notes  
12. API Endpoints (Summary)  
13. Data Models (Summary)  
14. Error Handling & Responses  
15. Logging & Monitoring  
16. Deployment Checklist  
17. Troubleshooting  
18. Future Enhancements  

---

## 1. Overview & Responsibilities
This service exposes REST endpoints for:
- User authentication (JWT issuance & verification).
- Admin authentication (separate credentials & role‑based JWT).
- Menu, categories, coupons (READ endpoints; CREATE/UPDATE not shown here but easily extensible).
- Order lifecycle: create, list (scoped to user), update (admin route for status changes).
- Payment orchestration with Razorpay (create order & verify signature).
- (Optional) push notification token capture endpoint (ready to add).

Principles: **least data exposure**, **ownership enforcement**, **stateless auth**, **server‑side signature validation**, **defensive sanitization**.

---

## 2. Architecture & Flow
```
Mobile App ──(JWT)──▶ /api/orders (scoped)
						 │
						 ├──▶ /api/payments/razorpay/create-order  (creates Razorpay order)
						 ├──▶ Razorpay Checkout (client SDK)
						 └──▶ /api/payments/razorpay/verify (HMAC signature check)

Admin Dashboard ──(Admin JWT)──▶ /api/admin/orders (list/update all orders)

MongoDB Atlas <── Mongoose Models (User, Order, Item, Coupon, Category)
```

---

## 3. Tech Stack
| Concern | Tool |
|---------|------|
| Runtime | Node.js LTS |
| Framework | Express |
| Database | MongoDB (Mongoose ODM) |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Payments | Razorpay Node SDK + crypto (HMAC verification) |
| Config | dotenv |
| Security Helpers | CORS, input validation (manual), JWT middleware |

---

## 4. Directory Layout (Core)
```
backend/
	server.js               # App bootstrap, route mounting, health & 404
	routes/
		authRoutes.js         # (Assumed) user auth endpoints
		orderRoutes.js        # User-scoped order operations
		paymentRoutes.js      # Razorpay create + verify
		adminRoutes.js        # Admin order listing/updating
		adminAuthRoutes.js    # Admin login (JWT issuance)
		menuRoutes.js         # Menu & categories
		couponRoutes.js       # Coupons
	middleware/
		auth.js               # User JWT verification
		adminJwt.js           # Admin JWT verification (role=admin)
		adminAuth.js (deprecated placeholder)
	models/
		Order.js              # Order schema (with items)
		... (User, Item, Category, Coupon etc. expected)
```

---

## 5. Environment Variables (`backend/.env`)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=secret_xxx
ADMIN_USERNAME=admin@chaicafe2025
ADMIN_PASSWORD=chaicafeteria2025
PORT=5000              # optional
```
Never commit real secrets. Use deployment provider secret managers.

---

## 6. Setup & Running Locally
```powershell
cd backend
npm install
npm start          # runs server.js (production mode minimal)
# or for auto-reload
npx nodemon server.js
```
Default: `http://localhost:5000` with REST namespace under `/api/*`.

Health check:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health -Method Get
```

---

## 7. Authentication (Users & Admin)
### User JWT
- Issued after credential verification (`/api/auth/login` – assumed).
- Attached as `Authorization: Bearer <token>`.
- Middleware `auth` decodes & attaches `req.user` (id, etc.).
- Order creation ignores any user field in body; always uses `req.user.id` to prevent spoofing.

### Admin JWT
Flow:
1. POST `/api/admin/auth/login` with `{ username, password }`.
2. Server matches env `ADMIN_USERNAME` & `ADMIN_PASSWORD`.
3. Signs JWT payload: `{ username, role: 'admin', iat, exp }` (12h expiration configured in route code).
4. Admin routes use `adminJwt` middleware (reject if role !== 'admin').

### Token Expiry & Renewal
- On 401 responses the admin client clears token & redirects to login.
- Users should re-login manually when expired; sliding refresh not yet implemented.

---

## 8. Payments (Razorpay Integration)
### Create Order
`POST /api/payments/razorpay/create-order`
Body example:
```json
{ "amount": 25900, "currency": "INR", "receipt": "rcpt_123" }
```
Server returns:
```json
{ "orderId": "order_ABC123", "amount": 25900, "currency": "INR" }
```

### Verify Payment
`POST /api/payments/razorpay/verify`
Body (from client after Razorpay checkout):
```json
{
	"razorpay_order_id": "order_ABC123",
	"razorpay_payment_id": "pay_DEF456",
	"razorpay_signature": "<HMAC>"
}
```
Server logic:
1. Construct `payload = order_id + '|' + payment_id`.
2. Compute HMAC SHA256 with `RAZORPAY_KEY_SECRET`.
3. Timing-safe compare with provided signature.
4. Respond success / failure. (Order creation in DB can be tied here or performed pre‑verification with a pending flag.)

### Notes
- All amounts are integer paise.
- Client key is `RAZORPAY_KEY_ID`; secret never sent to client.

---

## 9. Orders Domain Logic
| Concern | Implementation |
|---------|----------------|
| Ownership | `GET /api/orders` queries `{ user: req.user.id }` |
| Creation | Server injects `user` before save; ignores body spoofing |
| Status changes | Admin via `/api/admin/orders/:id` PUT |
| Price safety | Discount & deliveryFee stored; client also recomputes defensively |
| Reorder support | Item structure preserved for re-add in mobile app |
| Timestamps | Mongoose timestamps used (`createdAt`, `updatedAt`) |

Distance-based checks and COD restrictions have been removed from the client; server does not enforce distance rules.

---

## 10. Notifications Support (Optional Future)
Add (proposed) endpoint to persist Expo push tokens:
```
POST /api/users/push-token  (Authorization: Bearer <userJWT>)
{ "expoPushToken": "ExponentPushToken[abc...]" }
```
Then maintain a collection (User field) and send remote push via Expo Push API on order status update.

---

## 11. Security Hardening Notes
| Area | Current | Recommendation |
|------|---------|----------------|
| CORS | `app.use(cors())` open | Restrict to known origins in production |
| Rate limiting | Not applied | Add express-rate-limit on auth / payment routes |
| Input validation | Manual minimal | Add schema validation (zod / joi) |
| Error leakage | Console logs errors | Use structured logger & sanitize messages |
| Admin credentials | Env based | Move to hashed store / 2FA if multi-admin needed |
| HTTPS | Depends on host | Enforce TLS at load balancer / platform |

---

## 12. API Endpoints (Summary)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | - | Health probe |
| POST | /api/auth/login | - | User login (returns JWT) |
| GET | /api/menu | - | Menu listing (example) |
| GET | /api/orders | User JWT | List user orders |
| POST | /api/orders | User JWT | Create order (user inferred) |
| PUT | /api/orders/:id | User JWT | (If implemented) update user order |
| POST | /api/payments/razorpay/create-order | User JWT | Create Razorpay order |
| POST | /api/payments/razorpay/verify | User JWT | Verify payment signature |
| POST | /api/admin/auth/login | - | Admin login (admin JWT) |
| GET | /api/admin/orders | Admin JWT | List all orders |
| PUT | /api/admin/orders/:id | Admin JWT | Update order status |

> Additional routes (coupons, categories) follow similar patterns.

---

## 13. Data Models (Simplified)
### Order (`models/Order.js`)
```js
{
	user: ObjectId('User'),
	items: [{
		item: ObjectId('Item'),
		name: String,
		price: Number,
		qty: Number,
		image: String,
		category: ObjectId('Category')
	}],
	total: Number,
	subtotal: Number,
	deliveryFee: Number,
	discount: Number,
	couponCode: String,
	orderType: 'Pickup' | 'Delivery',
	paymentMethod: String,
	status: 'Order Placed' | 'Packing' | 'Shipped' | 'Out for delivery' | 'Delivered' | 'Cancelled',
	customerName: String,
	phone: String,
	address1: String,
	address2: String,
	landmark: String,
	pincode: String,
	notes: String,
	createdAt: Date,
	updatedAt: Date
}
```

Other implied models (User, Item, Category, Coupon) not shown but standard.

---

## 14. Error Handling & Responses
| Scenario | Status | Body |
|----------|--------|------|
| Auth required (no token) | 401 | `{ "message": "Missing Authorization header" }` (admin) / custom (user) |
| Invalid token | 401 | `{ "message": "Invalid or expired token" }` |
| Forbidden (role) | 403 | `{ "message": "Forbidden: admin role required" }` |
| Not found (order) | 404 | `{ "message": "Order not found" }` |
| Generic server error | 500 | `{ "message": "Server error" }` |
| 404 fallback unmatched route | 404 | `{ "message": "Not Found" }` |

Return shapes favor simplicity; extend with `code` field for frontend mapping if needed.

---

## 15. Logging & Monitoring
Current: console logging (startup, DB connect, caught errors). For production consider:
- Winston / Pino structured JSON logs.
- Correlation IDs (middleware injecting request id).
- Metrics: /metrics (Prometheus) & error rate alerts.

---

## 16. Deployment Checklist
| Task | Done? |
|------|-------|
| Set all env vars (including secrets) |  |
| Enable TLS (reverse proxy / hosting) |  |
| Restrict CORS origins |  |
| Add rate limiting |  |
| Configure logging & rotation |  |
| Run smoke tests (health + create/verify payment) |  |
| Monitor DB connection pool usage |  |
| Set up backup / retention for MongoDB |  |

---

## 17. Troubleshooting
| Symptom | Potential Cause | Resolution |
|---------|-----------------|------------|
| 401 on /api/orders | Missing/expired JWT | Re-login; check Authorization header |
| 401 on admin routes | Using user token | Use admin login endpoint for admin JWT |
| Razorpay verify fails | Wrong secret / mutated orderId | Confirm secrets & orderId pairing |
| All orders returned to non-admin | Old unscoped route | Ensure updated orderRoutes with auth middleware deployed |
| CORS errors in browser | Wildcard dev config vs prod host | Set explicit origin(s) in CORS middleware |
| Duplicate daily notifications | Client scheduling logic reruns | It clears previous; ensure single login event |

---

## 18. Future Enhancements
- Order status change webhooks (server → push notifications automatically).
- Role-based multi-admin (RBAC) & audit trail.
- Inventory & stock deduction logic.
- Promo code management CRUD + usage limits.
- Rate limiting & IP allowlists on payment endpoints.
- OpenAPI/Swagger spec generation (e.g., using `swagger-ui-express`).
- Unit/integration tests (Jest + supertest).

---

## Quick Payment Order Test (PowerShell)
```powershell
$host = "localhost:5000"   # or production
Invoke-RestMethod -Uri "http://$host/api/payments/razorpay/create-order" -Method Post -ContentType 'application/json' -Body '{"amount":12345,"currency":"INR","receipt":"rcpt_test"}'
```
Expected: `{ "orderId": "order_...", "amount": 12345, "currency": "INR" }`.

---

## License
Internal / Private (add license if open sourcing).

## Maintainer
Chai Cafeteria Engineering Team

---

> For holistic platform documentation (mobile + admin) see repository root `readme.md`.

