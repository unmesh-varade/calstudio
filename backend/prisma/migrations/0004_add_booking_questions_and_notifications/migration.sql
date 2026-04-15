-- CreateEnum
CREATE TYPE "BookingQuestionType" AS ENUM ('shortText', 'longText');

-- CreateTable
CREATE TABLE "event_type_questions" (
    "id" SERIAL NOT NULL,
    "event_type_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" "BookingQuestionType" NOT NULL,
    "placeholder" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_type_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_answers" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "question_id" INTEGER,
    "question_label" TEXT NOT NULL,
    "question_type" "BookingQuestionType" NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_type_questions_event_type_id_sort_order_idx" ON "event_type_questions"("event_type_id", "sort_order");

-- CreateIndex
CREATE INDEX "booking_answers_booking_id_idx" ON "booking_answers"("booking_id");

-- CreateIndex
CREATE INDEX "booking_answers_question_id_idx" ON "booking_answers"("question_id");

-- AddForeignKey
ALTER TABLE "event_type_questions" ADD CONSTRAINT "event_type_questions_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_answers" ADD CONSTRAINT "booking_answers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_answers" ADD CONSTRAINT "booking_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "event_type_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
