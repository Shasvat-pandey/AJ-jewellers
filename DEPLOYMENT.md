# AJ Jewellers — Deployment Guide & Operational Checklist

## 1. Production Architecture Overview

The application is deployed as a two-tier architecture:
- **Frontend SPA:** Vite React build deployed on a high-availability CDN or Static App Hosting (e.g., Cloudflare Pages, Vercel, Firebase Hosting, AWS S3+CloudFront).
- **Backend API:** Node.js/Express service running behind a reverse proxy (Nginx / Cloudflare) with persistent volume attachment for `uploads/` and `archives/`.
- **Database:** MongoDB Atlas M0/M10+ with IP access lists, automated backups, and TLS 1.3 enforced.

---

## 2. Environment Variables Checklist

### Backend (`server/.env`)
| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | e.g. `5000` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string with replica set & credentials |
| `JWT_SECRET` | Yes | Cryptographically random secret (>= 32 characters) |
| `CLIENT_URL` | Yes | Production frontend URL(s), comma-separated (e.g. `https://ajjewellers.in,https://www.ajjewellers.in`) |
| `ADMIN_INITIAL_PASSWORD` | Optional | Used only during `seedAdmin.js` initial provisioning |
| `EMAIL_USER` | Yes | SMTP user for order confirmation & invoice emails |
| `EMAIL_PASS` | Yes | SMTP password / App Password (no hardcoded credentials) |
| `NOREPLY_EMAIL` | Optional | Default: `no-reply@ajjewellers.in` |
| `DNS_SERVERS` | Optional | Custom DNS servers if hosting environment requires explicit resolvers |

*Note: All legacy `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` variables are obsolete and should be purged.*

### Frontend (`client/.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE` | Yes | Backend production API root (e.g. `https://api.ajjewellers.in`) |

---

## 3. Persistent Storage Configuration

Containerized deployments (Docker, Render, Railway, AWS ECS) must attach a persistent storage volume mounted at:
- `/server/uploads` (for product imagery and private payment evidence in `uploads/evidence`)
- `/server/archives` (for generated invoice PDF backups)

If using cloud object storage (AWS S3 or Cloudinary):
- Keep product imagery in a public bucket.
- Store payment evidence in a private, non-public bucket accessed only via signed URLs or streamed through the authenticated `/api/orders/:id/payment-evidence/:filename` proxy endpoint.

---

## 4. Production Deployment Steps

1. **Verify Environment Configurations:**
   Ensure all production secrets in `server/.env` are populated and meet security requirements.
2. **Execute Database Seed / Verification:**
   ```bash
   cd server
   node seedAdmin.js # Creates initial admin if not existing
   ```
3. **Build Frontend Bundle:**
   ```bash
   cd client
   npm run build
   # Verify 'dist' directory is produced without errors
   ```
4. **Start Backend Service:**
   ```bash
   cd server
   npm start # Runs node server.js with production monitoring (PM2 or container orchestrator)
   ```
5. **Verify HTTPS & Strict CORS:**
   Verify `curl -I -H "Origin: https://evil.com" https://api.ajjewellers.in/api/products` rejects with CORS policy error.
