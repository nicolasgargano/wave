import { defineConfig } from "drizzle-kit"
export default defineConfig({
  schema: "./app/server/schema.ts",
  dialect: "postgresql",
  tablesFilter: ["wave_*"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
