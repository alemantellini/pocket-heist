import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

// component imports
import AuthLoader from "@/components/AuthLoader"

describe("AuthLoader", () => {
  it("renders an accessible loading status", () => {
    render(<AuthLoader />)

    expect(screen.getByRole("status")).toHaveTextContent("Loading…")
  })

  it("hides the decorative icon from assistive tech", () => {
    const { container } = render(<AuthLoader />)

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    )
  })
})
