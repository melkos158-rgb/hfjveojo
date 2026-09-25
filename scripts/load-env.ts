import { config } from "dotenv";

/** Load .env.local first (local overrides, git-ignored), then .env. Railway injects variables directly, so both are optional. */
config({ path: ".env.local" });
config();
