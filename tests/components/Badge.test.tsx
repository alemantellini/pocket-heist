import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import Badge from "@/components/Badge"

describe("Badge", () => {
  it("renders its text", () => {
    render(<Badge>Active</Badge>)

    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("renders every variant", () => {
    render(
      <>
        <Badge variant="success">Done</Badge>
        <Badge variant="error">Failed</Badge>
      </>,
    )

    expect(screen.getByText("Done")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })
})
