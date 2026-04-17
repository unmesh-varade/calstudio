# CalStudio

CalStudio is a full-stack scheduling and booking platform inspired by Cal.com, built for a single-admin workflow with public booking links, timezone-aware slot generation, booking management, and email notifications.

---

## Live Demo Links

| Resource | Link |
|---|---|
| Frontend | https://calstudio.vercel.app/ |
| Backend API | Deployed Express API configured through `VITE_API_BASE_URL` |
| GitHub Repository | https://github.com/unmesh-varade/calstudio |

---

## Screenshots

| Dashboard | Public Booking Flow |
|---|---|
| Add dashboard screenshot here | Add public booking screenshot here |

| Event Types | Bookings |
|---|---|
| Add event types screenshot here | Add bookings dashboard screenshot here |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, TanStack Query |
| UI | Custom CSS, Lucide React, react-day-picker |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Email | Nodemailer with SMTP |
| Deployment | Vercel for frontend, cloud-hosted Node API, hosted PostgreSQL |

---

## Features

### Admin Dashboard

- Create, edit, list, activate/deactivate, and delete event types.
- Configure event title, description, duration, URL slug, buffer time, and custom booking questions.
- Manage weekly availability rules with timezone support.
- View upcoming, past, and cancelled bookings.
- Cancel bookings, reschedule bookings, and request a guest-side rebooking flow.

### Public Booking Experience

- Public profile page with active event types.
- Public event page with calendar-based date selection.
- Timezone-aware available slots for guests.
- Booking form with name, email, timezone, and event-specific custom questions.
- Booking confirmation page with event and attendee details.
- Public manage links for guest cancellation and rescheduling using secure tokens.

### Scheduling Logic

- Stores bookings in UTC for deterministic scheduling.
- Interprets availability in the organizer schedule timezone.
- Filters booked slots before showing availability.
- Prevents double booking with time-overlap checks.
- Applies event-level buffer time between meetings.

### Email Notifications

- Booking confirmation emails.
- Cancellation emails.
- Reschedule confirmation emails.
- Request-reschedule emails.

---

## Project Structure

```txt
calstudio/
+-- backend/
|   +-- prisma/
|   |   +-- migrations/
|   |   +-- schema.prisma
|   |   +-- seed.js
|   +-- src/
|   |   +-- config/
|   |   +-- controllers/
|   |   +-- db/
|   |   +-- middleware/
|   |   +-- routes/
|   |   +-- services/
|   |   +-- utils/
|   |   +-- validations/
|   |   +-- app.js
|   |   +-- server.js
|   +-- package.json
+-- frontend/
|   +-- public/
|   +-- src/
|   |   +-- app/
|   |   +-- components/
|   |   +-- features/
|   |   +-- layouts/
|   |   +-- lib/
|   |   +-- pages/
|   |   +-- styles/
|   +-- package.json
+-- .env.example
+-- README.md
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/unmesh-varade/calstudio.git
cd calstudio
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

Create environment files using the variables listed below:

```txt
backend/.env
frontend/.env
```

### 5. Run Database Migrations and Seed Data

```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

### 6. Start the Backend

```bash
cd backend
npm run dev
```

The backend runs on:

```txt
http://localhost:4000
```

### 7. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend runs on:

```txt
http://localhost:5173
```

### 8. Run Backend Tests

```bash
cd backend
npm test
```

---

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGIN` | Allowed frontend origin |
| `EMAIL_FROM` | Sender address for notification emails |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_SECURE` | Enables secure SMTP connection |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |

---

## API Endpoints

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check API health |

### Event Types

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/event-types` | List admin event types |
| `POST` | `/api/event-types` | Create an event type |
| `PATCH` | `/api/event-types/:id` | Update an event type |
| `DELETE` | `/api/event-types/:id` | Delete an event type |

### Availability

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/availability` | Get default availability schedule |
| `PUT` | `/api/availability` | Update availability rules and timezone |

### Admin Bookings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/bookings?view=upcoming` | List bookings by timeline view |
| `GET` | `/api/bookings/:id` | Get booking details |
| `GET` | `/api/bookings/:id/reschedule/slots` | Get admin reschedule slots |
| `POST` | `/api/bookings/:id/reschedule` | Reschedule booking as admin |
| `POST` | `/api/bookings/:id/request-reschedule` | Ask guest to rebook |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel booking as admin |

### Public Booking

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/public/profiles/:username` | Get public profile and active event types |
| `GET` | `/api/public/profiles/:username/event-types/:slug` | Get public event details |
| `GET` | `/api/public/profiles/:username/event-types/:slug/slots` | Get available public slots |
| `POST` | `/api/public/bookings` | Create public booking |
| `GET` | `/api/public/bookings/:bookingId` | Get booking confirmation details |
| `GET` | `/api/public/bookings/:bookingId/manage` | Get manage-booking details with token |
| `GET` | `/api/public/bookings/:bookingId/reschedule/slots` | Get guest reschedule slots |
| `POST` | `/api/public/bookings/:bookingId/reschedule` | Reschedule booking as guest |
| `POST` | `/api/public/bookings/:bookingId/cancel` | Cancel booking as guest |

---

## Deployment Details

| Service | Usage |
|---|---|
| Vercel | Frontend hosting |
| Node hosting platform | Backend Express API deployment |
| Hosted PostgreSQL | Production database |
| SMTP provider | Transactional booking emails |

### Production Configuration

- Frontend uses `VITE_API_BASE_URL` to call the deployed backend API.
- Backend uses `DATABASE_URL` for PostgreSQL and `CORS_ORIGIN` for allowed frontend origins.
- Emails are optional in local development; if SMTP variables are missing, the API can run without sending real email.
- No Google Calendar integration is required; availability and bookings are managed internally through the app database.

---

## Learnings / Challenges

- Designed a normalized scheduling schema with users, schedules, event types, bookings, questions, and answers.
- Implemented timezone-safe slot generation by storing bookings in UTC and interpreting availability in the organizer timezone.
- Added conflict prevention using overlap checks before booking creation and rescheduling.
- Built reusable public and admin booking flows for slot selection, confirmation, cancellation, and rescheduling.
- Kept the application single-admin as required, while leaving the schema flexible enough for future multi-user support.

---

## Future Improvements

- Add authentication and multi-user workspaces.
- Add multiple availability schedules in the dashboard UI.
- Add date overrides for blocked dates and custom one-off hours.
- Add richer custom question types such as phone, select, checkbox, and URL.
- Add calendar integrations such as Google Calendar or Outlook as an optional sync layer.
- Move email delivery to a background queue for better reliability.

