import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
const sql = neon(
  "postgresql://beat_Cancer_owner:rO6cTMFRd7ix@ep-old-king-a5kd4sn2.us-east-2.aws.neon.tech/cancer?sslmode=require"
);
export const db = drizzle(sql, { schema });
