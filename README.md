# Cal Studio

A Cal.com-inspired scheduling platform built as a single-admin full-stack application.

Cal Studio allows an organizer to define availability, create event types, share booking links, and manage bookings through a streamlined dashboard. The system focuses on correct scheduling logic, timezone safety, and a clean booking experience.

---

## Live Demo

* Frontend: https://your-deployment-url
* Backend API: https://your-backend-url/api

---

## Overview

This project replicates the core experience of modern scheduling tools such as Cal.com, with emphasis on:

* deterministic slot generation
* timezone-safe scheduling
* conflict-free booking
* clear and explainable architecture

---

## Schema Design

The database schema is centered around organizer availability, event configuration, bookings, custom intake questions, and booking lifecycle changes such as cancellation and rescheduling.

### Entity Relationship Summary

| Entity | Purpose | Key Fields | Relationships |
|---|---|---|---|
| `User` | Represents the organizer/admin in this MVP | `username`, `name`, `email`, `defaultTimezone` | Has many `AvailabilitySchedule`, `EventType`, `Booking` |
| `AvailabilitySchedule` | Stores a named schedule and its timezone | `name`, `timezone`, `isDefault` | Belongs to `User`; has many `AvailabilityRule`, `EventType` |
| `AvailabilityRule` | Defines weekly recurring availability windows | `weekday`, `startTime`, `endTime` | Belongs to `AvailabilitySchedule` |
| `EventType` | Represents a public bookable meeting type | `title`, `slug`, `description`, `durationMinutes`, `bufferMinutes`, `isActive` | Belongs to `User` and `AvailabilitySchedule`; has many `Booking`, `EventTypeQuestion` |
| `EventTypeQuestion` | Stores custom questions shown during booking | `label`, `type`, `placeholder`, `isRequired`, `sortOrder` | Belongs to `EventType`; has many `BookingAnswer` |
| `Booking` | Stores a scheduled meeting between organizer and guest | `attendeeName`, `attendeeEmail`, `attendeeTimezone`, `startTimeUtc`, `endTimeUtc`, `status`, `cancelledAt` | Belongs to `User` and `EventType`; has many `BookingAnswer` |
| `BookingAnswer` | Stores responses to booking questions | `questionLabel`, `questionType`, `value` | Belongs to `Booking`; optionally references `EventTypeQuestion` |

### Booking Lifecycle Fields

The `Booking` model also stores rescheduling/self-service management fields:

| Field | Purpose |
|---|---|
| `manageToken` | Secure public manage link for reschedule/cancel actions |
| `previousStartTimeUtc` | Stores the old slot start time after reschedule |
| `previousEndTimeUtc` | Stores the old slot end time after reschedule |
| `rescheduledAt` | Timestamp for when the booking was last rescheduled |
| `rescheduleReason` | Optional reason entered during reschedule flow |

### Enums

| Enum | Values | Purpose |
|---|---|---|
| `BookingStatus` | `scheduled`, `cancelled` | Tracks booking lifecycle state |
| `BookingQuestionType` | `shortText`, `longText` | Defines supported custom question types |

### Relationship Notes

- A `User` can own multiple schedules and event types.
- An `AvailabilitySchedule` contains multiple weekly `AvailabilityRule` rows.
- Each `EventType` is attached to exactly one schedule.
- A `Booking` is created for one event type and one organizer.
- `BookingAnswer` is stored separately so booking responses remain available in the dashboard.
- `BookingAnswer` keeps question label/type data even if the original question changes later.

### Design Decisions

- Bookings are stored in UTC to keep scheduling deterministic across timezones.
- Availability is authored in the schedule’s timezone.
- Public attendees can view slots in their own selected timezone.
- Buffer time is part of the event type, not the booking.
- Custom questions are attached to event types, while answers are attached to bookings.
- `manageToken` enables public self-service actions without requiring authentication.

---

## Features

### Event Types

* Create, edit, and delete event types
* Unique public booking links via slug
* Configurable duration and description

### Availability

* Weekly availability rules (weekday + time range)
* Timezone-aware scheduling
* Slots generated dynamically based on rules

### Public Booking Flow

* Public profile and event pages
* Calendar-based date selection
* Real-time slot generation
* Booking form with custom questions
* Double booking prevention
* Booking confirmation page

### Bookings Dashboard

* View upcoming, past, and cancelled bookings
* Cancel bookings
* Reschedule bookings (admin and guest flows)

---

## Bonus Features Implemented

* Responsive UI (desktop, tablet, mobile)
* Buffer time between meetings
* Custom booking questions
* Email notifications (booking, cancellation, reschedule)
* Guest timezone-aware slot display
* Public booking management (reschedule/cancel via secure token)

---

## Tech Stack

### Frontend

* React
* Vite
* React Router
* TanStack Query
* react-day-picker
* Custom CSS

### Backend

* Node.js
* Express
* Prisma ORM
* PostgreSQL
* Zod validation
* Nodemailer (SMTP-based email delivery)

---

## API Overview

### Admin Routes

* GET /api/event-types
* POST /api/event-types
* PATCH /api/event-types/:id
* DELETE /api/event-types/:id
* GET /api/bookings
* PATCH /api/bookings/:id/cancel

### Public Routes

* GET /api/public/profiles/:username
* GET /api/public/.../slots
* POST /api/public/bookings

---

## Data Model Highlights

Key entities:

* **User**: organizer identity
* **AvailabilitySchedule + Rules**: weekly availability
* **EventType**: meeting template
* **Booking**: stores attendee + UTC time range

### Important Design Decisions

* All bookings are stored in UTC
* Availability is interpreted in schedule timezone
* Slots are generated dynamically, not stored
* Double booking is prevented using overlap checks

Overlap rule:

```txt
newStart < existingEnd && newEnd > existingStart
```

---

## Booking Flow

1. User opens public booking link
2. Selects date and timezone
3. Slots are generated from availability
4. Booked slots are filtered out
5. Booking is created and stored in UTC
6. Confirmation email is sent

---

## Getting Started

### 1. Clone repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install dependencies

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

---

### 3. Setup environment variables

Backend (`backend/.env`):

```env
PORT=4000
DATABASE_URL=your_database_url
CORS_ORIGIN=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email
SMTP_PASS=your_app_password
SMTP_SECURE=true
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

---

### 4. Run database

```bash
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
```

---

### 5. Start application

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm run dev
```

---

## Seeded Demo Data

* Default user: `codemorty`
* Availability: Mon–Fri, 09:00–17:00 (Asia/Kolkata)
* Sample event types: Intro Call, Project Review

Example URLs:

* /codemorty
* /codemorty/intro-call

---

## Testing

Backend tests cover:

* slot generation
* overlap detection
* buffer handling

Run:

```bash
npm test
```

---

## Known Scope

* Single-admin system (no authentication)
* No date overrides yet
* Limited custom question types
* Basic email delivery via SMTP

---

## Future Improvements

* Multiple availability schedules in UI
* Date overrides and blocked dates
* Richer custom question types
* Queue-based email system
* Multi-user support and authentication

---

## Key Learning Focus

This project emphasizes:

* scheduling logic design
* timezone-safe systems
* conflict prevention
* booking lifecycle management

---

## Author

Unmesh Varade

---
