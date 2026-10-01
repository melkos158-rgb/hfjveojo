-- Free first photo (virtual staging): one per person, claimed from a link sent to the customer's email.
-- `free` marks such orders (no payment, excluded from revenue and paid-order counts); `freeKey` is the normalised
-- email of a claimed free photo, unique so that each person gets one.
ALTER TABLE "Order" ADD COLUMN "free" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "freeKey" TEXT;
CREATE UNIQUE INDEX "Order_freeKey_key" ON "Order"("freeKey");
