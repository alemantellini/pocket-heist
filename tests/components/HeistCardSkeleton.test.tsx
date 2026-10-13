import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

// component imports
import HeistCardSkeleton from "@/components/HeistCardSkeleton"

describe("HeistCardSkeleton", () => {
  it("renders a hidden placeholder", () => {
    render(<HeistCardSkeleton />)

    expect(screen.getByTestId("heist-card-skeleton")).toHaveAttribute(
      "aria-hidden",
      "true",
    )
  })

  it("has no link or text", () => {
    render(<HeistCardSkeleton />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(screen.getByTestId("heist-card-skeleton")).toHaveTextContent("")
  })
})
