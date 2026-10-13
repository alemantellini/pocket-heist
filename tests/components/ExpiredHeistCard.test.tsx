import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

// component imports
import ExpiredHeistCard from "@/components/ExpiredHeistCard"
import type { Heist } from "@/types/firestore"

function makeHeist(overrides: Partial<Heist> = {}): Heist {
  return {
    id: "h1",
    createdAt: new Date(2025, 11, 3, 17, 0),
    title: "Swap the office plant",
    description: "Secret details",
    createdBy: "u1",
    createdByCodename: "shadowfox",
    assignedTo: "u2",
    assignedToCodename: "quietowl",
    deadline: new Date(2025, 11, 5, 17, 0),
    finalStatus: null,
    ...overrides,
  }
}

describe("ExpiredHeistCard", () => {
  it("links the title to the heist details page", () => {
    render(<ExpiredHeistCard heist={makeHeist()} />)

    expect(
      screen.getByRole("link", { name: "Swap the office plant" }),
    ).toHaveAttribute("href", "/heists/h1")
  })

  it("shows the codenames and the deadline date", () => {
    render(<ExpiredHeistCard heist={makeHeist()} />)

    expect(screen.getByText("@quietowl")).toBeInTheDocument()
    expect(screen.getByText("@shadowfox")).toBeInTheDocument()
    expect(screen.getByText("Dec 5, 05:00 PM")).toBeInTheDocument()
  })

  it("gives the status badge and the people screen reader context", () => {
    render(<ExpiredHeistCard heist={makeHeist({ finalStatus: "success" })} />)

    expect(screen.getByText("Status:")).toBeInTheDocument()
    expect(screen.getByText("Assigned to")).toBeInTheDocument()
    expect(screen.getByText("Created by")).toBeInTheDocument()
  })

  it("falls back to unknown when a codename is missing", () => {
    render(
      <ExpiredHeistCard
        heist={makeHeist({ assignedToCodename: "", createdByCodename: "" })}
      />,
    )

    expect(screen.getAllByText("@unknown")).toHaveLength(2)
  })

  it("shows a success badge", () => {
    render(<ExpiredHeistCard heist={makeHeist({ finalStatus: "success" })} />)

    expect(screen.getByText("success")).toBeInTheDocument()
  })

  it("shows a failed badge for a failure", () => {
    render(<ExpiredHeistCard heist={makeHeist({ finalStatus: "failure" })} />)

    expect(screen.getByText("failed")).toBeInTheDocument()
  })

  it("shows an unresolved badge when no final status is set", () => {
    render(<ExpiredHeistCard heist={makeHeist({ finalStatus: null })} />)

    expect(screen.getByText("unresolved")).toBeInTheDocument()
  })

  it("does not show a time left or the description", () => {
    render(<ExpiredHeistCard heist={makeHeist()} />)

    expect(screen.queryByText("Overdue")).not.toBeInTheDocument()
    expect(screen.queryByText("Secret details")).not.toBeInTheDocument()
  })
})
