-- Actual Stripe fees per payment (from the charge's balance transaction), converted to the payment currency, so
-- net revenue and profit use real fees instead of an estimate. Settlement currency + FX rate kept for audits.
ALTER TABLE "Payment" ADD COLUMN "feeCents" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "netCents" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "settlementCurrency" TEXT;
ALTER TABLE "Payment" ADD COLUMN "exchangeRate" DOUBLE PRECISION;
