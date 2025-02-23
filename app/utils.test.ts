import { expect, test, describe } from "bun:test"
import { format_message, LINE_LENGTH } from "./utils"

describe("format_message", () => {
  test.only("one short line", () => {
    const message = "Hello, world!"
    const desired = [
      "Hello, world!", //
      "",
      "",
      "",
      "",
      "",
    ]
    const formatted = format_message(message)
    expect(formatted).toEqual(desired)
  })

  test.only("one newline", () => {
    const message = "Hello,\nworld!"
    const desired = [
      "Hello,                    ", //
      "world!",
      "",
      "",
      "",
      "",
    ]
    const formatted = format_message(message)
    expect(formatted).toEqual(desired)
  })

  test.only("multiple newlines", () => {
    const message = "Hello,\nworld!\nThis is a test."
    const desired = [
      "Hello,                    ", //
      "world!                    ",
      "This is a test.",
      "",
      "",
      "",
    ]
    const formatted = format_message(message)
    expect(formatted).toEqual(desired)
  })

  test.only("long word causes newline", () => {
    const message = "Hello,\nworld!\n12345678901234567890 1234567890 asd"
    const desired = [
      "Hello,                    ",
      "world!                    ",
      "12345678901234567890      ",
      "1234567890 asd",
      "",
      "",
    ]
    const formatted = format_message(message)
    expect(formatted).toEqual(desired)
  })

  test.only("very long words gets split", () => {
    const message =
      "Hello,\nworld!\n123456789012345678901234567890 1234567890 1234567890123456789"
    const desired = [
      "Hello,                    ",
      "world!                    ",
      "12345678901234567890123456",
      "7890 1234567890           ",
      "1234567890123456789",
      "",
    ]
    const formatted = format_message(message)
    expect(formatted).toEqual(desired)
  })

  test.only("line length word doesn't cause newline", () => {
    const message = "123456789_123456789_123456"
    const desired = [
      "123456789_123456789_123456", //
      "",
      "",
      "",
      "",
      "",
    ]
    const formatted = format_message(message)
    expect(formatted).toEqual(desired)
  })

  test.only("line with newline gets padded before next line has content", () => {
    const message = "Hello,\n"
    const desired = ["Hello,                    ", "", "", "", "", ""]
    const formatted = format_message(message)
    expect(formatted).toEqual(desired)
  })
})
