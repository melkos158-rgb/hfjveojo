-- ORVIONIS initial schema (PostgreSQL). Generated to match prisma/schema.prisma naming conventions.
-- Apply with `prisma migrate deploy` (production) or `prisma migrate dev` (local).

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "ToolStatus" AS ENUM ('DRAFT', 'VALIDATING', 'LIVE', 'PAUSED', 'DEPRECATED');
CREATE TYPE "Fulfillment" AS ENUM ('AUTO', 'MANUAL', 'HYBRID');
CREATE TYPE "ProductType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION', 'CREDIT_PACK');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'REVIEW', 'COMPLETED', 'FAILED', 'RETRYING', 'REFUNDED', 'CANCELED');
CREATE TYPE "QcStatus" AS ENUM ('NOT_RUN', 'PASSED', 'FLAGGED', 'APPROVED_BY_HUMAN', 'REJECTED');
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'SUCCEEDED', 'FAILED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE');
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'QC_FLAGGED');
CREATE TYPE "FileKind" AS ENUM ('INPUT', 'OUTPUT');
CREATE TYPE "StorageBackend" AS ENUM ('DB', 'S3');
CREATE TYPE "OutputType" AS ENUM ('PDF', 'MARKDOWN', 'JSON', 'ZIP', 'LINK');
CREATE TYPE "ExperimentStatus" AS ENUM ('PLANNED', 'RUNNING', 'WON', 'LOST', 'PAUSED');
CREATE TYPE "ReportPeriod" AS ENUM ('DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "redirect" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagline" TEXT,
    "status" "ToolStatus" NOT NULL DEFAULT 'DRAFT',
    "fulfillment" "Fulfillment" NOT NULL DEFAULT 'AUTO',
    "version" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ToolVersion" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "toolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'ONE_TIME',
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "credits" INTEGER,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "userId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "toolId" TEXT NOT NULL,
    "toolVersion" INTEGER NOT NULL DEFAULT 1,
    "productId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "intake" JSONB NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "attribution" JSONB,
    "experimentId" TEXT,
    "variantId" TEXT,
    "qcStatus" "QcStatus" NOT NULL DEFAULT 'NOT_RUN',
    "qcNotes" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "amountRefundedCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "receiptUrl" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT,
    "stripeRefundId" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ToolRun" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "toolVersion" INTEGER NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "steps" JSONB NOT NULL,
    "costMicros" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ToolRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "toolRunId" TEXT,
    "userId" TEXT,
    "toolId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicros" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT,
    "kind" "FileKind" NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storage" "StorageBackend" NOT NULL DEFAULT 'DB',
    "key" TEXT,
    "data" BYTEA,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneratedOutput" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "toolRunId" TEXT,
    "type" "OutputType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileId" TEXT,
    "content" JSONB,
    "previewText" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedOutput_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "targetCustomer" TEXT NOT NULL,
    "offer" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "priceCents" INTEGER,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'PLANNED',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "successCriteria" TEXT NOT NULL,
    "failureCriteria" TEXT NOT NULL,
    "expected" JSONB,
    "actual" JSONB,
    "conclusion" TEXT,
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperimentVariant" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "weight" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "orderId" TEXT,
    "experimentId" TEXT,
    "path" TEXT,
    "referrer" TEXT,
    "utm" JSONB,
    "props" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketingChannel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingChannel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChannelCost" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "experimentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "costCents" INTEGER NOT NULL,
    "hours" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelCost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "rating" INTEGER,
    "text" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT NOT NULL DEFAULT 'order_page',
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CeoReport" (
    "id" TEXT NOT NULL,
    "period" "ReportPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "costMicros" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CeoReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'error',
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key","windowStart")
);

CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "MagicLinkToken_tokenHash_key" ON "MagicLinkToken"("tokenHash");
CREATE INDEX "MagicLinkToken_email_idx" ON "MagicLinkToken"("email");
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");
CREATE UNIQUE INDEX "ToolVersion_toolId_version_key" ON "ToolVersion"("toolId", "version");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE UNIQUE INDEX "Order_stripeCheckoutSessionId_key" ON "Order"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");
CREATE INDEX "Order_toolId_status_idx" ON "Order"("toolId", "status");
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");
CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt");
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");
CREATE INDEX "AiRequest_createdAt_idx" ON "AiRequest"("createdAt");
CREATE INDEX "AiRequest_toolId_createdAt_idx" ON "AiRequest"("toolId", "createdAt");
CREATE INDEX "File_orderId_idx" ON "File"("orderId");
CREATE UNIQUE INDEX "Experiment_key_key" ON "Experiment"("key");
CREATE UNIQUE INDEX "ExperimentVariant_experimentId_key_key" ON "ExperimentVariant"("experimentId", "key");
CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");
CREATE INDEX "Event_sessionId_idx" ON "Event"("sessionId");
CREATE UNIQUE INDEX "MarketingChannel_key_key" ON "MarketingChannel"("key");
CREATE INDEX "AdminAction_createdAt_idx" ON "AdminAction"("createdAt");
CREATE INDEX "CeoReport_period_periodStart_idx" ON "CeoReport"("period", "periodStart");
CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ToolVersion" ADD CONSTRAINT "ToolVersion_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ExperimentVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ToolRun" ADD CONSTRAINT "ToolRun_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ToolRun" ADD CONSTRAINT "ToolRun_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_toolRunId_fkey" FOREIGN KEY ("toolRunId") REFERENCES "ToolRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "File" ADD CONSTRAINT "File_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedOutput" ADD CONSTRAINT "GeneratedOutput_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GeneratedOutput" ADD CONSTRAINT "GeneratedOutput_toolRunId_fkey" FOREIGN KEY ("toolRunId") REFERENCES "ToolRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedOutput" ADD CONSTRAINT "GeneratedOutput_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExperimentVariant" ADD CONSTRAINT "ExperimentVariant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChannelCost" ADD CONSTRAINT "ChannelCost_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "MarketingChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChannelCost" ADD CONSTRAINT "ChannelCost_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
