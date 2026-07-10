# Vadhiyar Agrotech

A clean, role-driven agriculture ecommerce platform with distinct customer, admin, and backend applications. Each part is a standalone project so they can be deployed and scaled independently.

## Run the applications
1. Install dependencies for each app once (`npm install` in `frontend`, `admin`, and `backend`).
2. From the repository root you can start any part via:
   - `npm run frontend` → Customer website (Vite)
   - `npm run admin` → Admin dashboard (Vite)
   - `npm run backend` → API + SQLite database (Node/Express)

## Overview
- **frontend**: Public-facing, multi-language storefront with cart, checkout, auth gating, and order tracking.
- **backend**: Express + Prisma + SQLite REST API with JWT auth, role enforcement, and validation.
- **admin**: Secure dashboard for managing products, customers, and orders plus analytics tiles.

## Languages & Branding
- Customer UI supports English, Hindi, Gujarati for labels, buttons, and messages.
- Agriculture-inspired branding with a green palette and Vadhiyar Agrotech logo used consistently.

## Security highlights
- Role-based auth (Customer/Admin) with hashed passwords.
- JWT-protected routes; admin routes explicitly guarded.
- Input validation across all endpoints.

## Next steps after setup
1. Run `npm run backend` and note the port (default `4000`).
2. Update frontend/admin `.env` if the backend URL differs.
3. Use Prisma migrations/seeding before first login (`npm run migrate` inside `backend`).
