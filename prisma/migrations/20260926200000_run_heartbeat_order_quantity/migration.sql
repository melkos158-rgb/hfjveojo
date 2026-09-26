-- Pipeline runs report a heartbeat while they work, so a run abandoned by a restarted or crashed worker can be taken
-- over instead of leaving its order stuck in PROCESSING.
ALTER TABLE "ToolRun" ADD COLUMN "heartbeatAt" TIMESTAMP(3);

-- Units charged per order (multi-room virtual staging: one unit per photo). Existing orders are single-unit.
ALTER TABLE "Order" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
