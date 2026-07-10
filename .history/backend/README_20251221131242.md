# Backend API

Node.js + Express REST API for Vadhiyar Agrotech with role-based security and SQLite.

## Setup
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and adjust values (especially `JWT_SECRET`).
3. Run Prisma migrate/seed:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
   - `npm run prisma:seed`

## Running
- Development server: `npm run dev`
- Production build: `npm run build` then `npm run start`

## Key APIs
- `/api/auth` → Register/login, profile
- `/api/products` → Browse products and categories
- `/api/orders` → Customer orders (requires JWT)
- `/api/admin` → Admin dashboard, product/order management (Admin JWT)
- `/api/customers` → Admin access to customer details
