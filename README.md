# Instant

QR-based shared bill-splitting payment platform. Merchants create bills with items, users scan a QR code and pay their share via Stripe Checkout. The platform holds funds until the bill is fully paid, then automatically transfers the full amount to the merchant's Stripe Connect account.

**Winner — 5th Place (2nd in Track) at SalamHack Hackathon 2026, among 311 teams.**

- **Tech stack**: Node.js, Express.js 5, PostgreSQL (Supabase), Stripe Connect/Checkout, Socket.IO, node-pg-migrate, Swagger/OpenAPI 3.0
- **Runtime**: ESM only (`"type": "module"`), Node 22+
- **Docs**: Swagger UI at `/api-docs`

## How it works

1. **Merchant** signs up and creates a bill with line items (e.g. a restaurant bill)
2. Bill gets a unique `nanoid(8)` token embedded in a QR code URL
3. **Users** scan the QR, see the bill, and choose an amount to pay
4. A Stripe Checkout session is created for the user's share
5. When checkout completes, a Stripe webhook updates the payment to `succeeded`
6. The system checks if the bill is fully covered — if so, it marks the bill `paid` and initiates a Stripe transfer to the merchant's Connect account
7. Once the transfer succeeds, the bill is marked `completed`

## Transaction safety

Concurrent Stripe webhooks for the same bill can race. The system prevents this with a split write path:

1. **Payment update** — outside any transaction (independent fact: the payment happened)
2. **Bill mark-paid** — inside a DB transaction with `SELECT ... FOR UPDATE` row lock on the bill. This serializes concurrent webhooks: only one can see the bill as `open` and mark it `paid`
3. **Stripe transfer** — after the transaction commits (can't roll back a Stripe API call). If the transfer fails, the bill stays `paid` with `transferred=false` — money is safe in the platform account

See `billRepo.markBillPaidIfFullyCovered` for the implementation.

## Bill & payment lifecycles

### Bill status

```
open → paid → completed
 │                    │
 │                    └─ Money transferred to merchant's Connect account
 └─ Accepting payments

Any status → expired (bill expired before full payment)
```

- `open` — accepting payments
- `paid` — all funds collected, transfer pending or failed (money in platform account)
- `completed` — money transferred to merchant's Connect account
- `expired` — bill expired before full payment

**`paid` ≠ `completed`**: `paid` means users paid but money is still in the platform account. `completed` means the merchant actually received it.

### Payment status

```
pending → succeeded   (checkout completed)
        → cancelled    (checkout session expired after 30 min)
        → failed       (card declined — future)
```

`pending` counts toward remaining balance to prevent overpayment while a checkout session is open. When a session expires, the payment is cancelled and the balance freed.

## Quick start

### Prerequisites

- Node.js 22+
- PostgreSQL database (Supabase or local)
- Stripe account for testing

### Installation

```bash
git clone https://github.com/abdelrahmann22/nodejs-instant-api.git
cd nodejs-instant-api
npm install
```

### Configuration

Create a `.env` file:

```ini
DATABASE_URL=postgresql://user:password@host:5432/instant
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
FRONTEND_APP_URL=http://localhost:3000
```

### Run migrations

```bash
npm run migrate:up
```

### Start the server

```bash
# Development (nodemon)
npm run dev

# Production
npm start
```

### Local Stripe testing

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Use the whsec_ from output as STRIPE_WEBHOOK_SECRET
# Test card: 4242 4242 4242 4242
```

## API

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/merchant/signup` | No | Register merchant |
| POST | `/api/auth/merchant/login` | No | Login merchant |
| POST | `/api/auth/merchant/onboarding-link` | Merchant | Get Stripe Connect onboarding link |
| GET | `/api/auth/merchant/onboarding-status` | Merchant | Check onboarding status |
| POST | `/api/auth/user/signup` | No | Register user |
| POST | `/api/auth/user/login` | No | Login user |

### Bills

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bills` | Merchant | Create a bill |
| GET | `/api/bills/:id` | User | Get bill by ID + token |
| GET | `/api/bills/merchant` | Merchant | List merchant's bills |

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments` | User | Initiate payment (returns Stripe Checkout URL) |
| POST | `/api/payments/:id/cancel` | User | Cancel a pending payment |

### Webhooks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/webhooks/stripe` | Stripe Sig | Handle Stripe webhook events |

Full interactive docs available at `/api-docs` when the server is running.

## Project structure

```
src/
  server.js              → Entrypoint (connects DB, starts app)
  app.js                 → Express 5 app (middleware, routes, error handler)
  routes/                → Express routers
  controllers/*/         → Request handlers (validate input, call services)
  services/*/            → Business logic (no raw SQL, call repos)
  repositories/          → Raw SQL via pg Pool (single file per domain)
  middlewares/           → protect (JWT), restrictTo (role: "merchant"|"user")
  utils/                 → AppError(statusCode, message), JWT sign/verify
  config/
    db.js                → pg Pool (Supabase pooler, SSL)
    swagger.js           → Inline OpenAPI 3.0 spec
    socket.js            → Socket.IO config (planned)
migrations/              → node-pg-migrate ESM files
```

## Database

- PostgreSQL via Supabase pooler with SSL
- Connection pool: production 5 max / dev 20 max, 10s connection timeout
- Tables: `merchants`, `users`, `bills`, `payments`
- Bills: 10-hour expiry (`expires_at`), `nanoid(8)` token for QR access, `transferred` + `transfer_id` columns for transfer tracking
- Stripe Connect account created lazily — `stripe_account_id` starts `null`, set when merchant starts onboarding
- Indexes: `bills.token` (QR lookups), `payments.payment_intent_id` (webhook lookups)
- PostgreSQL enum types: `bill_status`, `payment_status` — must cast when updating (e.g. `$1::bill_status`)

## Transfer guard

Transfers are skipped if the merchant is not fully onboarded:
- `stripe_account_id` is null
- `charges_enabled=false`
- `details_submitted=false`

The bill stays at `paid` + `transferred=false` — money is safe in the platform account until the merchant completes onboarding.

## Key design decisions

- **Express 5** — async error handling differs from v4; errors in async handlers are automatically forwarded to the error middleware
- **Layered architecture** — controllers validate input and call services, services contain business logic and call repositories, repositories execute raw SQL. No ORM
- **ESM migrations** — `export const up/down`, not `module.exports`
- **Middleware order matters** — Stripe webhook route (`/api/webhooks/stripe`) uses `express.raw()` before `express.json()`. Swapping these breaks webhook signature verification
- **DNS override** — `dns.setDefaultResultOrder("ipv4first")` is required for Supabase pooler DNS resolution
- **Role-based middleware** — `restrictTo("merchant")` sets `req.merchant = req.user`, so merchant-scoped endpoints use `req.merchant.id` (never `req.body.merchant_id`, preventing impersonation)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with nodemon |
| `npm start` | Production server |
| `npm run migrate:up` | Apply pending migrations |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate:create <name>` | Create new migration |


