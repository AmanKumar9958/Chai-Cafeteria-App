# Chai Cafeteria App

## Online payments (Razorpay)

This repo now includes backend endpoints for Razorpay under `backend/`. The mobile app calls:

- POST `${EXPO_PUBLIC_API_URL}/payments/razorpay/create-order`
- POST `${EXPO_PUBLIC_API_URL}/payments/razorpay/verify`

Where `EXPO_PUBLIC_API_URL` ends with `/api` (e.g., `https://<your-domain>.onrender.com/api`).

### Backend setup

1) Configure environment variables in `backend/.env` or your cloud provider:

- `MONGO_URI` (existing)
- `JWT_SECRET` (existing)
- `RAZORPAY_KEY_ID` (from Razorpay Dashboard)
- `RAZORPAY_KEY_SECRET` (from Razorpay Dashboard)

2) Install and run the backend locally (optional):

```
cd backend
npm install
npm start
```

The server listens on `PORT` (default 5000) and serves the payment routes at `/api/payments/*`.

### Verify endpoints quickly (PowerShell)

```
# Replace <HOST> with your domain, amount with paise value
Invoke-RestMethod -Uri "https://<HOST>/api/payments/razorpay/create-order" -Method Post -ContentType 'application/json' -Body '{"amount":12345,"currency":"INR","receipt":"rcpt_test"}'
```

Expected JSON: `{ "orderId": "order_...", "amount": 12345, "currency": "INR" }`.

### Frontend env

In `frontend/.env` set:

```
EXPO_PUBLIC_API_URL=https://<HOST>/api
EXPO_PUBLIC_RAZORPAY_KEY_ID=<your_public_key_id>
```

If your backend mounts different paths, you can override per-app without code changes:

```
EXPO_PUBLIC_RAZORPAY_CREATE_PATH=/payments/razorpay/create-order
EXPO_PUBLIC_RAZORPAY_VERIFY_PATH=/payments/razorpay/verify
```

### Notes

- The backend verifies the payment signature with HMAC SHA256.
- A JSON 404 fallback is added to avoid HTML "Cannot POST" pages.
- For production, restrict CORS to your app origin.

