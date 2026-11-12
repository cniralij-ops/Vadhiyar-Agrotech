# Vadhiyar Agrotech

A multilingual agricultural storefront with public product browsing and an owner-only product manager at `/owner`.

## Run the applications
1. Install dependencies for each app once (`npm install` in `frontend`, `admin`, and `backend`).
2. From the repository root you can start any part via:
   - `npm run frontend` → Customer website (Vite)
   - `npm run admin` → Admin dashboard (Vite)
   - `npm run backend` → API + PostgreSQL database (Node/Express)

## Overview
- **frontend**: Public-facing, multi-language storefront with cart, checkout, auth gating, and order tracking.
- **backend**: Express + Prisma + PostgreSQL REST API with JWT auth, role enforcement, and validation.
- **admin**: Secure dashboard for managing products, customers, and orders plus analytics tiles.

## Languages & Branding
- Customer UI supports English, Hindi, Gujarati for labels, buttons, and messages.
- Agriculture-inspired branding with a green palette and Vadhiyar Agrotech logo used consistently.

## Security highlights
- Role-based auth (Customer/Admin) with hashed passwords.
- JWT-protected routes; admin routes explicitly guarded.
- Input validation across all endpoints.

## Owner product management
- Owner sign-in at `/owner` is password-only. Only the configured `OWNER_EMAIL` account with the `ADMIN` role can add, edit, hide, feature, or delete products; public browsing and enquiries do not require sign-in.
- Uploaded product images and product availability/visibility settings are stored in PostgreSQL.
- Set backend `DATABASE_URL` to the PostgreSQL connection string used by the running API and owner provisioning. Backend configuration loads `backend/.env`; host environment variables take precedence.
- Set `NODE_ENV=production` and `JWT_SECRET` to a random value of at least 32 characters on the backend host. The API fails at startup if the production database URL or JWT secret is missing or invalid.
- The existing migration history contains SQLite SQL while the production datasource is PostgreSQL, so it must not be replayed against production. The additive product-management schema is applied idempotently when the backend starts, or explicitly with `npm --prefix backend run prisma:deploy`.
- To provision or reset the owner without changing product data, set `OWNER_EMAIL`, `OWNER_NAME`, `OWNER_PHONE`, and a unique `OWNER_PASSWORD` (at least 14 characters) in the backend environment, then run `npm --prefix backend run owner:provision`. Do not commit environment files or passwords.
- Product and owner-provisioning commands must use the same `DATABASE_URL` as the running API.

## Next steps after setup
1. Configure the backend PostgreSQL URL and production JWT secret.
2. Build and start the backend; startup applies the additive product-management schema before accepting requests.
3. Configure the owner environment and run `npm --prefix backend run owner:provision` against the same database before owner sign-in.
