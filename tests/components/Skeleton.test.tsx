import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

// component imports
import Skeleton from "@/components/Skeleton"

describe("Skeleton", () => {
  it("renders the placeholder card", () => {
    render(<Skeleton />)

    expect(screen.getByTestId("skeleton")).toBeInTheDocument()
  })

  it("is hidden from assistive technology", () => {
    render(<Skeleton />)

    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true")
  })
})
