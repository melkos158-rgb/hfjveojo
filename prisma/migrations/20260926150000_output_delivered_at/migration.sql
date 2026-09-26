-- Which outputs the customer actually received. The order page shows the latest delivered set, so a re-run or a
-- free redo replaces the earlier files instead of mixing old and new ones.
ALTER TABLE "GeneratedOutput" ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- Backfill: everything already attached to a delivered order counts as delivered with it.
UPDATE "GeneratedOutput" AS o
SET "deliveredAt" = ord."deliveredAt"
FROM "Order" AS ord
WHERE o."orderId" = ord."id" AND ord."deliveredAt" IS NOT NULL;
