# Cal Studio

Cal Studio is a Cal.com-inspired scheduling platform built as a single-admin MVP. It lets one default admin manage event types and weekly availability, share public booking links, accept guest bookings, and review or cancel bookings from an admin dashboard.

## Tech Stack

Frontend:
- React
- Vite
- React Router
- TanStack Query
- react-day-picker
- custom CSS

Backend:
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Zod validation

## What’s Implemented

- Event type CRUD
- Weekly availability management with timezone
- Public profile page by username
- Public booking page by username + event slug
- Slot generation with overlap prevention
- Guest booking form
- Booking confirmation page
- Admin bookings dashboard
- Booking cancellation
- Seeded demo data
- Basic scheduling tests

## Public Routes

- `/` landing page
- `/:username` public profile page
- `/:username/:slug` public booking page
- `/booking/:bookingId?email=guest@example.com` confirmation page

Sample seeded public URLs after seeding:

- `/codemorty`
- `/codemorty/intro-call`
- `/codemorty/project-review`

## Admin Routes

- `/dashboard/event-types`
- `/dashboard/event-types/new`
- `/dashboard/event-types/:id`
- `/dashboard/availability`
- `/dashboard/bookings`

## API Overview

Admin:
- `GET /api/event-types`
- `POST /api/event-types`
- `PATCH /api/event-types/:id`
- `DELETE /api/event-types/:id`
- `GET /api/availability`
- `PUT /api/availability`
- `GET /api/bookings?view=upcoming|past|cancelled`
- `PATCH /api/bookings/:id/cancel`

Public:
- `GET /api/public/profiles/:username`
- `GET /api/public/profiles/:username/event-types/:slug`
- `GET /api/public/profiles/:username/event-types/:slug/slots?date=YYYY-MM-DD`
- `POST /api/public/bookings`
- `GET /api/public/bookings/:bookingId?email=guest@example.com`

Infra:
- `GET /api/health`

## Project Structure

```txt
frontend/
backend/
README.md
```

```txt
backend/
  prisma/
    schema.prisma
    seed.js
    clear.js
    migrations/
  src/
    app.js
    server.js
    routes/
    controllers/
    services/
    validations/
    middleware/
    utils/
    config/
    db/
  tests/
```

```txt
frontend/
  src/
    app/
    pages/
    layouts/
    components/
    features/
    lib/
```

## Environment Variables

Backend:

- `PORT`
- `DATABASE_URL`
- `CORS_ORIGIN`

Frontend:

- `VITE_API_BASE_URL`

## Local Setup

### 1. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

### 2. Configure environment variables

Backend `.env`:

```env
PORT=4000
DATABASE_URL=your_postgres_connection_string
CORS_ORIGIN=http://localhost:5173
```

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 3. Apply migrations

From `backend/`:

```bash
npx prisma migrate deploy
```

For local development, `npx prisma migrate dev` also works.

### 4. Seed the database

From `backend/`:

```bash
npm run prisma:seed
```

### 5. Start the backend

From `backend/`:

```bash
npm run dev
```

### 6. Start the frontend

From `frontend/`:

```bash
npm run dev
```

## Helpful Database Scripts

Clear all rows without dropping tables:

```bash
cd backend
node prisma/clear.js
```

Seed again:

```bash
cd backend
npm run prisma:seed
```

## Running Tests

From `backend/`:

```bash
npm test
```

Current tests cover key scheduling rules:
- overlap detection
- slot alignment
- slot generation excluding booked and past times

## Core Business Rules

- There is only one admin in this MVP
- Event type slug is unique
- Public pages are organized under the admin username
- Booking duration comes from the event type
- Bookings are stored in UTC
- Availability is interpreted in the admin’s selected timezone
- Cancelled bookings do not block future slots
- Overlapping bookings for the same admin are not allowed, even across event types

Overlap rule:

```txt
newStart < existingEnd && newEnd > existingStart
```

## Seeded Demo Data

The seed script creates:

- 1 default admin user
- username: `codemorty`
- 1 default availability schedule
- weekday rules for Monday to Friday
- 2 sample event types
- upcoming bookings
- past bookings
- cancelled bookings

## Assumptions

- Authentication is intentionally omitted
- The product is a single-admin MVP
- Public booking links are accessible without login
- Username-based public routing was chosen to better match the Cal.com mental model
- Styling uses custom CSS instead of Tailwind to keep the visual system explicit and lightweight

## Deployment Notes

Suggested setup:

- Frontend: Vercel or Netlify
- Backend: Render or Railway
- Database: Neon

Typical deployment flow:

1. Deploy PostgreSQL database
2. Set backend env vars and deploy backend
3. Set frontend `VITE_API_BASE_URL` to deployed backend API URL
4. Deploy frontend

## Interview Notes

If asked about tradeoffs:

- Prisma was used to keep schema and database access explicit
- Scheduling logic was separated into utilities and services for easier testing
- The public routing model uses `/:username/:slug` to mirror Cal.com more closely than a flat slug-only route
- The app prioritizes correctness of booking logic and clarity of explanation over feature breadth
