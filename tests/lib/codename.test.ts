import { afterEach, describe, expect, it, vi } from "vitest"

import { ADJECTIVES, ANIMALS, MATERIALS, generateCodename } from "@/lib/codename"

describe("codename", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("has no duplicate words within or across the sets", () => {
    const all = [...ADJECTIVES, ...MATERIALS, ...ANIMALS]

    expect(new Set(all).size).toBe(all.length)
  })

  it("generates three PascalCase words, one from each set in order", () => {
    const codename = generateCodename()
    const words = codename.match(/[A-Z][a-z]+/g) ?? []

    expect(codename).toMatch(/^([A-Z][a-z]+){3}$/)
    expect(words).toHaveLength(3)
    expect(ADJECTIVES).toContain(words[0])
    expect(MATERIALS).toContain(words[1])
    expect(ANIMALS).toContain(words[2])
  })

  it("picks words using Math.random", () => {
    vi.spyOn(Math, "random").mockReturnValue(0)

    expect(generateCodename()).toBe(
      `${ADJECTIVES[0]}${MATERIALS[0]}${ANIMALS[0]}`,
    )
  })
})
