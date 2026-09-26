-- Admin pipeline test orders (no money moved) are flagged so metrics can exclude them.
ALTER TABLE "Order" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
