-- Stripe test and live side by side: each order remembers the mode of its Checkout Session, and whether Stripe
-- reported the checkout completed (async payment methods settle days later — those orders are not abandoned).
ALTER TABLE "Order" ADD COLUMN "livemode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "checkoutCompletedAt" TIMESTAMP(3);

-- Every order so far was taken in the sandbox; paid ones completed their checkout at paidAt.
UPDATE "Order" SET "checkoutCompletedAt" = "paidAt" WHERE "paidAt" IS NOT NULL;
