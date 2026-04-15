ALTER TABLE "bookings"
ADD COLUMN "manage_token" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
ADD COLUMN "previous_start_time_utc" TIMESTAMP(3),
ADD COLUMN "previous_end_time_utc" TIMESTAMP(3),
ADD COLUMN "rescheduled_at" TIMESTAMP(3),
ADD COLUMN "reschedule_reason" TEXT;

CREATE UNIQUE INDEX "bookings_manage_token_key" ON "bookings"("manage_token");
