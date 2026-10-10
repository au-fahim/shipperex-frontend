# ShipperEx Frontend

ShipperEx is a responsive international shipping platform for booking and tracking document and parcel shipments. This Next.js frontend connects to the ShipperEx backend and provides separate workspaces for customers, managers, couriers, and administrators.

## Project links

- **Frontend repository:** [au-fahim/shipperex-frontend](https://github.com/au-fahim/shipperex-frontend)
- **Backend repository:** [au-fahim/ShipperEx-backend](https://github.com/au-fahim/ShipperEx-backend)
- **Live backend:** [shipperex-backend.vercel.app](https://shipperex-backend.vercel.app)
- **API documentation:** [ShipperEx API on Postman](https://documenter.getpostman.com/view/54943329/2sBYAxQ9p9)
- **Live frontend:** 

## Workspaces and features

- **Customer:** Create shipments, review quotes, track deliveries, view payment history and notifications, and manage a profile.
- **Manager:** Review the shipment queue, assign couriers, update shipment checkpoints, and view reports.
- **Courier:** View assigned pickup and delivery tasks, record task outcomes, and manage a profile.
- **Admin:** Manage users and staff, hubs, countries, shipping rates, reports, and audit logs.
- **Public:** Explore ShipperEx, register or sign in, and track a shipment by tracking number.
- **Payments:** Start Stripe Checkout in test mode and verify its success or cancellation return through the backend.

Workspace routes are protected and role-specific. The login page provides one-click demo sign-in buttons for the available roles.

## Demo admin account

Use the following dedicated evaluation account on the login page:

| Email                 | Password      |
| --------------------- | ------------- |
| `admin@shipperex.com` | `Admin@12345` |

The demo account must exist and be active in the connected backend seed data. Do not use personal credentials for evaluation.

## Technology

- Next.js App Router and TypeScript
- Tailwind CSS v4, with the ShipperEx design system in global CSS
- Radix UI Alert Dialog, Lucide React, and Sonner
- TanStack Query for API data and caching
- React Hook Form and Zod for form handling and validation
- Recharts for dashboard visualizations
- Same-origin Next.js route handlers for backend API and authentication requests

## Run locally

Requirements: Node.js 20.9 or newer and pnpm.

1. Install the dependencies:

   ```bash
   pnpm install
   ```

2. Create the local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   On macOS or Linux, use `cp .env.example .env.local` instead. The example uses the deployed ShipperEx backend. To use a local B7A6 backend, set `BACKEND_API_URL=http://localhost:5000/api/v1`.

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The available project commands are:

```bash
pnpm lint
pnpm build
pnpm start
```

## Environment variables

| Variable             | Local value                                                               | Production value                              |
| -------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| `BACKEND_API_URL`    | `https://shipperex-backend.vercel.app/api/v1` (or your local backend URL) | `https://shipperex-backend.vercel.app/api/v1` |
| `AUTH_COOKIE_SECURE` | `false`                                                                   | `true`                                        |

For Vercel, add both variables to the frontend project's production environment settings and redeploy. Keep backend secrets and Stripe secret keys on the backend; they do not belong in frontend environment variables.

## API and authentication flow

The browser calls same-origin Next.js API routes. Those route handlers forward requests to `BACKEND_API_URL`; authentication tokens are held in HTTP-only cookies. Core account, shipment, operations, and payment data comes from the backend. The bundled country and city catalog is used to populate shipment location selectors.

## Stripe return URLs

The backend owns Checkout creation and payment verification. After the frontend is deployed, configure the backend's `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` values to the deployed frontend origin, ending in `/payment/success` and `/payment/cancel`. For local frontend work, use `http://localhost:3000/payment/success` and `http://localhost:3000/payment/cancel`. The frontend does not mark a payment as paid on its own.
