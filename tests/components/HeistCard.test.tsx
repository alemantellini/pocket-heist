import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

// component imports
import HeistCard from "@/components/HeistCard"
import type { Heist } from "@/types/firestore"

const HOUR = 60 * 60 * 1000

function makeHeist(overrides: Partial<Heist> = {}): Heist {
  return {
    id: "h1",
    createdAt: new Date(),
    title: "Swap the office plant",
    description: "Secret details",
    createdBy: "u1",
    createdByCodename: "shadowfox",
    assignedTo: "u2",
    assignedToCodename: "quietowl",
    deadline: new Date(Date.now() + 30 * HOUR),
    finalStatus: null,
    ...overrides,
  }
}

describe("HeistCard", () => {
  it("links the title to the heist details page", () => {
    render(<HeistCard heist={makeHeist()} />)

    expect(
      screen.getByRole("link", { name: "Swap the office plant" }),
    ).toHaveAttribute("href", "/heists/h1")
  })

  it("shows the assignee and creator codenames", () => {
    render(<HeistCard heist={makeHeist()} />)

    expect(screen.getByText("@quietowl")).toBeInTheDocument()
    expect(screen.getByText("@shadowfox")).toBeInTheDocument()
  })

  it("shows the time left for a future deadline", () => {
    render(<HeistCard heist={makeHeist()} />)

    expect(screen.getByText(/^1d \d+h$/)).toBeInTheDocument()
  })

  it("shows Overdue for a past deadline", () => {
    render(<HeistCard heist={makeHeist({ deadline: new Date(Date.now() - HOUR) })} />)

    expect(screen.getByText("Overdue")).toBeInTheDocument()
  })

  it("does not show the description", () => {
    render(<HeistCard heist={makeHeist()} />)

    expect(screen.queryByText("Secret details")).not.toBeInTheDocument()
  })
})
