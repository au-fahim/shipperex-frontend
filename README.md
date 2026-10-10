# ShipperEx

**Send it. Follow it. Know where it is.** ShipperEx makes it easier to send documents and parcels, see the price before booking, pay online, and follow each delivery until it arrives. Customers and delivery teams can see the information and updates they need in one place.

[Open ShipperEx](https://shipperex.vercel.app) · [API documentation](https://documenter.getpostman.com/view/54943329/2sBYAxQ9p9)

Whether you are sending a package or coordinating deliveries, ShipperEx helps make each step clear—from creating a shipment to recording its delivery.

## What you can do with ShipperEx

### 1. Book a document or parcel

Enter where the shipment is going, who is sending and receiving it, and the package details. ShipperEx shows the delivery price before you confirm, so you can review the cost before placing your order.

### 2. Track it from pickup to delivery

Enter your tracking number to see the latest shipment status and delivery updates. You can check progress without calling or guessing where your package is.

### 3. Keep shipment details and updates together

Customers can review their shipments, payments, and notifications in one place. Delivery teams can see assigned work and update shipment progress, helping everyone stay up to date.

### Tools for delivery teams

Managers can organize shipments, assign couriers, and record delivery progress. Couriers can view their assigned pickups and deliveries. Administrators can manage staff, delivery locations, shipping prices, and reports.

Sign in to see the tools available for your role. The login page also offers demo sign-in shortcuts when the corresponding demo accounts are set up.

## Try the live application

- **Frontend:** [shipperex.vercel.app](https://shipperex.vercel.app)
- **Backend:** [shipperex-backend.vercel.app](https://shipperex-backend.vercel.app)
- **API reference:** [ShipperEx Postman documentation](https://documenter.getpostman.com/view/54943329/2sBYAxQ9p9)
- **Frontend source:** [au-fahim/shipperex-frontend](https://github.com/au-fahim/shipperex-frontend)
- **Backend source:** [au-fahim/ShipperEx-backend](https://github.com/au-fahim/ShipperEx-backend)

### Demo administrator account

Use this account to explore the administrator workspace. It must exist and be active in the backend database.

| Email                 | Password      |
| --------------------- | ------------- |
| `admin@shipperex.com` | `Admin@12345` |

## Run locally

### Requirements

- Node.js 20.9 or newer
- pnpm 12.3.4 (the version recorded in `package.json`)
- Access to the ShipperEx backend, either the live API or a local backend instance

### Setup

From the frontend project directory:

1. Install dependencies from the lockfile:

   ```bash
   pnpm install
   ```

2. Create your local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   On macOS or Linux, use `cp .env.example .env.local`.

3. Check `.env.local`. The example points to the live backend. To use a backend running locally, set:

   ```dotenv
   BACKEND_API_URL=http://localhost:5000
   AUTH_COOKIE_SECURE=false
   ```

   For the deployed backend, use `https://shipperex-backend.vercel.app/api/v1`.

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000).

### Available commands

| Command       | Purpose                                     |
| ------------- | ------------------------------------------- |
| `pnpm dev`    | Start the local development server          |
| `pnpm lint`   | Lint the application and scripts with Biome |
| `pnpm build`  | Create a production build                   |
| `pnpm start`  | Serve the production build locally          |
| `pnpm format` | Format source files and scripts with Biome  |

## Configuration

The frontend uses server-side environment variables for its backend connection and authentication cookies. Do not add backend secrets or Stripe secret keys to this frontend repository.

| Variable             | Local development                            | Production                                    |
| -------------------- | -------------------------------------------- | --------------------------------------------- |
| `BACKEND_API_URL`    | `http://localhost:5000`, or the live API URL | `https://shipperex-backend.vercel.app/api/v1` |
| `AUTH_COOKIE_SECURE` | `false` for local HTTP                       | `true` for HTTPS                              |

If `BACKEND_API_URL` is omitted, the application defaults to localhost during development and the live ShipperEx API in production. Set `BACKEND_API_URL` explicitly in the frontend hosting environment to make the target unambiguous. In Vercel, add it to the frontend project's Production environment and redeploy after changing it.

## How the application works

- The browser sends API requests to same-origin Next.js route handlers.
- Those handlers forward requests to `BACKEND_API_URL`, keeping the backend origin out of browser-side API calls.
- Access and refresh tokens are stored in HTTP-only cookies. The API proxy refreshes an expired access token when a valid refresh token is available.
- Account, shipment, operations, and payment data are provided by the backend. The frontend includes a location catalog for shipment location selectors.
- Stripe Checkout is created and verified by the backend. Configure the backend's `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` to point to the frontend's `/payment/success` and `/payment/cancel` routes. For local development, those URLs are `http://localhost:3000/payment/success` and `http://localhost:3000/payment/cancel`.

## Built with

- Next.js App Router, React, and TypeScript
- Tailwind CSS v4
- TanStack Query for server data and caching
- React Hook Form and Zod for forms and validation
- Radix UI, Lucide React, and Sonner for interface components and feedback
- Recharts for dashboard visualizations
- Biome for linting and formatting

## Project links

- [Frontend repository](https://github.com/au-fahim/shipperex-frontend)
- [Backend repository](https://github.com/au-fahim/ShipperEx-backend)
- [Live frontend](https://shipperex.vercel.app)
- [Live backend](https://shipperex-backend.vercel.app)
- [API documentation](https://documenter.getpostman.com/view/54943329/2sBYAxQ9p9)
