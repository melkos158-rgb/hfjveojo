-- Public, unguessable id for the page that shows a virtual-staging order's unaltered original photo
-- (California AB 723 asks for a public link or QR code to the original next to digitally altered listing photos).
ALTER TABLE "Order" ADD COLUMN "publicToken" TEXT;
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");
