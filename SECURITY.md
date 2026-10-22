# AJ Jewellers — Application Security Policy & Remediation Report

## 1. Security Architecture Overview

This document details the security posture and comprehensive remediation executed on the AJ Jewellers platform. All vulnerabilities identified during the pre-deployment audit have been resolved.

---

## 2. Audit Remediation Matrix (SEC-01 through SEC-16)

| Finding ID | Title | Remediation Summary | Status |
|---|---|---|---|
| **SEC-01** | Broken Razorpay Service Exports | Razorpay integration decommissioned completely; `/api/payment` endpoints return HTTP 410 Gone; `razorpay.js` safely stubbed. | **RESOLVED** |
| **SEC-02** | Client-Forged Payment Status | Removed all client-controlled payment status flags. Orders are forced to `Pending` at creation. Only authenticated admins via `PUT /api/orders/:id/verify-payment` can certify payment. | **RESOLVED** |
| **SEC-03** | Client-Controlled Price & Gold Rate Bypass | Server-authoritative calculation in `POST /api/orders`. Product prices, weights, making charges, and GST are verified against database records. Expired rate locks are rejected. | **RESOLVED** |
| **SEC-04** | Broken Object-Level Authorization (BOLA) | `PUT /api/users/:id` enforces that a user can only edit their own allowed profile fields (name, phone, address). Role/status elevation is strictly restricted to admins. | **RESOLVED** |
| **SEC-05** | Hardcoded Secrets & Missing .gitignore | Removed hardcoded email passwords from code. Added `.gitignore` in root and server. Created sanitized `.env.example` templates. | **RESOLVED** |
| **SEC-06** | Wildcard CORS with Credentials | Replaced reflected wildcard origin with an explicit allowlist matching `CLIENT_URL` / `ALLOWED_ORIGINS` and trusted local dev origins. | **RESOLVED** |
| **SEC-07** | Dev Backdoors & Static OTP Bypass | Removed `/dev/delete-by-email` and `/dev/make-admin`. Removed hardcoded `'123456'` OTP bypass from registration flow. | **RESOLVED** |
| **SEC-08** | Weak / Missing JWT Secret | Mandatory startup validation: Server verifies `JWT_SECRET` exists, and in production enforces minimum length of 32 characters, refusing to start with weak/default secrets. | **RESOLVED** |
| **SEC-09** | External Appointment Data Exfiltration | Removed `formsubmit.co` redirect. Replaced with internal `Appointment` model and secure `POST /api/appointments` API with server validation. | **RESOLVED** |
| **SEC-10** | Missing Frontend Admin Route Guard | Created `AdminRoute.tsx` wrapper for `/admin-dashboard`. Backend independently enforces `protect` and `admin` on all administrative APIs. | **RESOLVED** |
| **SEC-11** | Sensitive Data in Audit Logs | Implemented payload sanitization in `auditMiddleware.js`. Passwords, OTPs, JWT tokens, and card details are redacted from logs and audit records. | **RESOLVED** |
| **SEC-12** | Default Administrator Credentials | Removed hardcoded `admin123` default password from `seedAdmin.js`. Requires strong `ADMIN_INITIAL_PASSWORD` supplied through protected environment variables. | **RESOLVED** |
| **SEC-13** | Ephemeral & Public Evidence Storage | Separated private evidence from public product media. Payment evidence stored in `server/uploads/evidence/` with direct public access blocked; streamed exclusively to authorized admins via `GET /api/orders/:id/payment-evidence/:filename`. | **RESOLVED** |
| **SEC-14** | Debug Invoice Endpoint Information Leak | Removed `/api/orders/:id/invoice/debug` and test routes leaking internal system traces and paths. | **RESOLVED** |
| **SEC-15** | Missing Admin Authorization Token | Standardized frontend auth utilities in `api.ts` (`authHeaders`, `authFetch`, `getAuthToken`). Admin login persists token and sends `Authorization: Bearer <token>` on all requests. | **RESOLVED** |
| **SEC-16** | Unconditional DNS Overrides | Made DNS overrides configurable via `DNS_SERVERS` environment variable with graceful fallback in development. | **RESOLVED** |

---

## 3. Reporting a Vulnerability

If you discover any security concern, please send a detailed disclosure to `security@ajjewellers.in`. We commit to acknowledging receipt within 24 hours and deploying fixes within 72 hours.
