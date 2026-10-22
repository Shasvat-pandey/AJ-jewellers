# AJ Jewellers — Automated & Manual Testing Specification

## 1. Automated Test Suite

A comprehensive test suite is located in `server/test/payment.test.js` validating critical business logic, security controls, and edge cases.

### Test Coverage Areas
1. **Server-Authoritative Pricing (SEC-03, FT-05):**
   - Verifies that tampering with `item.price` or `req.body.totalAmount` in client requests is completely discarded.
   - Verifies dynamic calculation based on gold weight, making charges, diamond value, and GST.
   - Verifies rejection of expired gold rate locks.
2. **Payment Security & State Machine (SEC-02, FT-06):**
   - Verifies that client requests with `paymentStatus: 'Paid'` are ignored, and order is strictly initialized as `Pending`.
   - Verifies that ordinary customers cannot access `PUT /api/orders/:id/verify-payment`.
   - Verifies that non-admins cannot upload to `POST /api/orders/:id/payment-evidence`.
   - Verifies that uploading evidence alone leaves the order in `Awaiting Verification` or unpaid state, NOT marked `Paid`.
   - Verifies that only authenticated admins can transition status to `Paid`.
3. **Inventory Management & Cancellation (FT-07):**
   - Verifies atomic stock deduction during order creation.
   - Verifies single stock restoration upon order cancellation.
   - Verifies idempotency (repeated cancellation calls do not restore stock multiple times).
4. **Access Control & BOLA (SEC-04):**
   - Verifies Customer A cannot modify Customer B's account.
   - Verifies customers cannot assign themselves the `admin` role.
5. **CORS & Retired Gateway Endpoints (SEC-01, SEC-06):**
   - Verifies unauthorized origins receive CORS rejection.
   - Verifies `/api/payment/*` endpoints return HTTP 410 Gone.

---

## 2. Running Automated Tests

```bash
cd server
node test/payment.test.js
```

---

## 3. Manual Verification Checklist

- [ ] **Checkout Page:** Navigate to `/checkout`. Verify that no Razorpay popups appear. Verify Cash and Bank Transfer options display store banking details.
- [ ] **Admin Orders View:** Navigate to `/admin-dashboard` -> Orders. Open an order. Verify the Payment Verification & Evidence section allows receipt attachment, transaction reference input, and payment confirmation.
- [ ] **Private Evidence Access:** Attempt to access an evidence image directly via browser URL without being logged in as admin. Verify HTTP 403 / 401 is returned.
- [ ] **Invoice PDF:** Download invoice for an unpaid order. Verify "PAYMENT PENDING - NOT A PROOF OF PAYMENT" is stamped clearly.
- [ ] **Internal Appointments:** Visit `/visit-us`, request an appointment. Verify submission succeeds via internal API `POST /api/appointments` and no data is sent to external services.
