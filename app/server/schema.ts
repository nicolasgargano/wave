import { text, pgTableCreator, uuid, timestamp } from "drizzle-orm/pg-core"

const table = pgTableCreator((name) => `wave_${name}`)

const timestamptz = () =>
  timestamp({ withTimezone: true, mode: "date", precision: 6 })

export const wave = table("wave", {
  id: uuid().primaryKey(),
  input: text().notNull(),
  lines: text().array().notNull(),
  created_at: timestamptz().notNull(),
})
