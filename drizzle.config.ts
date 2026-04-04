import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schemas",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});