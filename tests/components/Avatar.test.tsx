import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

// component imports
import Avatar from "@/components/Avatar"

describe("Avatar", () => {
  it("shows the first letter of a simple name", () => {
    render(<Avatar name="mario" />)

    expect(screen.getByRole("img", { name: "mario" })).toHaveTextContent("M")
  })

  it("shows the first two uppercase letters of a PascalCase name", () => {
    render(<Avatar name="MarioRossi" />)

    expect(screen.getByRole("img", { name: "MarioRossi" })).toHaveTextContent("MR")
  })

  it("uses only the first two uppercase letters of longer PascalCase names", () => {
    render(<Avatar name="MaryJaneWatson" />)

    expect(screen.getByRole("img")).toHaveTextContent("MJ")
  })

  it("shows a single letter for a capitalised single word", () => {
    render(<Avatar name="Mario" />)

    expect(screen.getByRole("img")).toHaveTextContent(/^M$/)
  })
})
