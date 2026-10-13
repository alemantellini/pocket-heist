import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import Footer from "@/components/Footer"

describe("Footer", () => {
  it("renders a contentinfo landmark", () => {
    render(<Footer />)

    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
  })

  it("renders the tagline", () => {
    render(<Footer />)

    expect(screen.getByText("Steal small. Laugh big.")).toBeInTheDocument()
  })

  it("renders the current year copyright", () => {
    render(<Footer />)

    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })
})
