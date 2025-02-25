import { Schema } from "effect"

export const LINE_LENGTH = 26
export const LINE_LENGTH_LAST = 10

export const Lines = Schema.mutable(
  Schema.Tuple(
    Schema.String.pipe(Schema.maxLength(LINE_LENGTH)),
    Schema.String.pipe(Schema.maxLength(LINE_LENGTH)),
    Schema.String.pipe(Schema.maxLength(LINE_LENGTH)),
    Schema.String.pipe(Schema.maxLength(LINE_LENGTH)),
    Schema.String.pipe(Schema.maxLength(LINE_LENGTH)),
    Schema.String.pipe(Schema.maxLength(LINE_LENGTH_LAST))
  )
)

export type Lines = typeof Lines.Type

export const Wave = Schema.Struct({
  input: Schema.String.pipe(Schema.maxLength(140)),
  lines: Lines,
})

export type Wave = typeof Wave.Type
