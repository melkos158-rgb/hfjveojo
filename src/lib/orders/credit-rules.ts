/** Pro credits, client-safe constants (src/lib/orders/credits.ts has the balance; the tool is pro-credits). */
export const CREDIT_TOOL_SLUG = "pro-credits";
/** The tool whose orders the credits pay for. */
export const CREDIT_USE_TOOL_SLUG = "virtual-staging";
export const CREDITS_PER_PACK = 25;
export const CREDIT_MONTHS = 12;
/** Staging orders paid with credits are $0 orders (`free: true`) whose freeKey starts with this. */
export const CREDIT_KEY_PREFIX = "credit:";
