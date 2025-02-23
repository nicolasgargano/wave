export const LINE_LENGTH = 26
export const LAST_LINE_LENGTH = 10

export function format_message(message: string): string[] {
  const lines: string[] = []

  const paragraphs = message.split(/(?<=\n)/)

  for (const paragraph of paragraphs) {
    const words = paragraph.split(" ")
    let currentLine = ""

    for (const word of words) {
      if (
        (currentLine ? currentLine.length + 1 : 0) + word.length <=
        LINE_LENGTH
      ) {
        currentLine += (currentLine ? " " : "") + word
      } else if (word.length > LINE_LENGTH) {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = ""
        }
        for (let i = 0; i < word.length; i += LINE_LENGTH) {
          const chunk = word.slice(i, i + LINE_LENGTH)
          if (i + LINE_LENGTH >= word.length) currentLine = chunk
          else lines.push(chunk)
        }
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }

    if (currentLine) lines.push(currentLine)
  }

  //console.table(lines.map((l) => l.replaceAll(" ", "·").replaceAll("\n", "↵")))

  const lastIndexWithContent = lines.findLastIndex((l) => l.length > 0)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i < lastIndexWithContent || line.endsWith("\n")) {
      const desiredLength = i < 5 ? LINE_LENGTH : LAST_LINE_LENGTH
      lines[i] = lines[i].replace("\n", "").padEnd(desiredLength)
    }
  }

  // console.table(lines.map((l) => l.replaceAll(" ", "·").replaceAll("\n", "↵")))

  while (lines.length < 6) lines.push("")
  return lines
}
