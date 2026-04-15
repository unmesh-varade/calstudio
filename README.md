# Cal Studio

Cal Studio is a Cal.com-inspired scheduling app built as a single-admin MVP. One organizer manages weekly availability and event types, shares public booking links, collects custom intake answers, receives bookings in UTC, and reviews or cancels them from a dashboard.

## Overview

The project has two apps:

- `frontend/`: React + Vite single-page app for the public booking flow and admin dashboard
- `backend/`: Express + Prisma API backed by PostgreSQL

The current product supports:

- event type CRUD
- per-event buffer time
- weekly availability with timezone-aware slot generation
- public profile pages under `/:username`
- public booking pages under `/:username/:slug`
- attendee-selected timezone display for slots
- custom booking questions
- booking confirmation pages
- admin bookings dashboard with submitted answers
- booking cancellation
- optional SMTP email notifications for booking create/cancel events
- seeded demo data and scheduling tests

## Tech Stack

Frontend:

- React
- Vite
- React Router
- TanStack Query
- `react-day-picker`
- custom CSS

Backend:

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Zod validation
- Nodemailer for SMTP email delivery

## Current Features

Implemented:

- event type create, update, delete, list
- event type fields: title, slug, description, duration, buffer, active state
- custom booking questions per event type
- weekly availability rules with a default schedule and timezone
- public organizer profile by username
- public event booking page by username and slug
- attendee timezone selection for viewing slots
- slot generation with overlap prevention and buffer-aware blocking
- public booking confirmation page
- booking answers shown in admin dashboard
- upcoming, past, and cancelled booking views
- booking cancellation from dashboard
- seeded demo data with event questions and booking answers
- backend scheduling tests

Partially implemented foundations:

- `AvailabilitySchedule` exists as a first-class model
- event types already belong to schedules
- the UI still manages only the default schedule in this MVP

## Booking and Timezone Behavior

A few rules are important to understand:

- availability rules are authored in the event schedule's timezone
- bookings are stored in UTC in the database
- public attendees can choose a timezone for viewing slots
- the public slot API returns only slots that fall on the attendee-selected local day
- labels on the public booking page are shown in the attendee-selected timezone
- when a slot is booked, the backend still saves the correct event-local slot by using the slot's underlying event date and time
- cancelled bookings do not block future availability
- overlapping bookings for the same organizer are not allowed, even across event types

## Data Model

Main Prisma models in `backend/prisma/schema.prisma`:

- `User`
  Organizer identity for this MVP. Includes `username`, `email`, `name`, and `defaultTimezone`.
- `AvailabilitySchedule`
  Stores named schedules and their timezone. The current UI uses the default one.
- `AvailabilityRule`
  Weekly weekday-based availability windows.
- `EventType`
  Public booking template with title, slug, duration, buffer time, schedule relation, and active state.
- `EventTypeQuestion`
  Custom intake questions attached to an event type.
- `Booking`
  Saved meeting instance with attendee info, UTC times, status, and cancellation timestamp.
- `BookingAnswer`
  Stored responses to custom booking questions.

Enums:

- `BookingStatus`: `scheduled`, `cancelled`
- `BookingQuestionType`: `shortText`, `longText`

## Public Routes

App routes:

- `/`
- `/:username`
- `/:username/:slug`
- `/booking/:bookingId?email=guest@example.com`

Sample seeded URLs after seeding:

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

Admin API:

- `GET /api/health`
- `GET /api/event-types`
- `POST /api/event-types`
- `PATCH /api/event-types/:id`
- `DELETE /api/event-types/:id`
- `GET /api/availability`
- `PUT /api/availability`
- `GET /api/bookings?view=upcoming|past|cancelled`
- `PATCH /api/bookings/:id/cancel`

Public API:

- `GET /api/public/profiles/:username`
- `GET /api/public/profiles/:username/event-types/:slug`
- `GET /api/public/profiles/:username/event-types/:slug/slots?date=YYYY-MM-DD&timezone=Area/City`
- `POST /api/public/bookings`
- `GET /api/public/bookings/:bookingId?email=guest@example.com`

## Project Structure

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
    config/
    controllers/
    db/
    middleware/
    routes/
    services/
    utils/
    validations/
  tests/
frontend/
  src/
    app/
    components/
    features/
    layouts/
    lib/
    pages/
README.md
```

## Environment Variables

Backend:

- `PORT`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `EMAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`

Frontend:

- `VITE_API_BASE_URL`

Example root `.env.example`:

```env
# Backend
PORT=4000
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
CORS_ORIGIN=http://localhost:5173

EMAIL_FROM=yourgmail@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_SECURE=true

# Frontend
VITE_API_BASE_URL=http://localhost:4000/api
```

Notes:

- email is optional for local development
- if SMTP is not configured, the app skips delivery and logs the notification payload instead
- Gmail testing works with an app password; production apps are better served by a transactional email provider or verified domain setup

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

Backend `backend/.env`:

```env
PORT=4000
DATABASE_URL=your_postgres_connection_string
CORS_ORIGIN=http://localhost:5173

EMAIL_FROM=yourgmail@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_SECURE=true
```

Frontend env:

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

## Useful Scripts

Backend:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm test
```

Clear all table rows without dropping tables:

```bash
cd backend
node prisma/clear.js
```

Frontend build:

```bash
cd frontend
npm run build
```

## Seeded Demo Data

The seed script currently creates:

- 1 organizer user
  `username: codemorty`
- 1 default availability schedule
  Monday-Friday, `09:00` to `17:00`, timezone `Asia/Kolkata`
- 2 event types
  `Intro Call` and `Project Review`
- buffer time examples
  `Intro Call` uses a buffer, `Project Review` does not
- custom question example
  `Intro Call` includes `Additional notes`
- sample bookings across states
  upcoming, past, and cancelled
- seeded booking answers for the `Additional notes` question

## Tests

Current backend tests cover core scheduling rules in `backend/tests/scheduling.test.js`:

- overlap detection
- slot alignment
- slot generation excluding past/booked slots
- buffer-time-aware slot blocking

## Core Business Rules

- this is a single-admin MVP with no authentication yet
- event type slug is globally unique
- public pages are organized by organizer username
- booking duration and buffer time come from the event type
- availability windows are interpreted in the schedule timezone
- bookings are stored in UTC
- public slot labels can be displayed in the attendee's chosen timezone
- cancelled bookings do not consume future availability
- organizer-side overlap checks are enforced during booking creation
- custom question answers are stored with each booking for later review

Overlap rule used during scheduling:

```txt
newStart < existingEnd && newEnd > existingStart
```

## Assumptions and Tradeoffs

- authentication and multi-user admin support are intentionally out of scope
- the dashboard currently edits only the default availability schedule even though the schema supports multiple schedules
- date overrides and rescheduling are not implemented yet
- email delivery is best-effort and non-blocking; booking creation should not fail just because email delivery fails
- custom questions currently support `shortText` and `longText`
- styling uses custom CSS instead of Tailwind to keep the visual system explicit and lightweight

## Deployment Notes

Suggested deployment stack:

- frontend: Vercel or Netlify
- backend: Render or Railway
- database: Neon

Typical deployment flow:

1. create the PostgreSQL database
2. configure backend environment variables
3. run migrations on the backend deployment
4. deploy backend
5. point `VITE_API_BASE_URL` at the deployed API
6. deploy frontend

## Future Work

Natural next feature areas:

- full multi-schedule management UI
- date overrides / blocked dates
- booking rescheduling flow
- richer booking question types
- stronger email delivery observability
- authentication and multi-user support
