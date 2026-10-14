import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"

const { useHeist } = vi.hoisted(() => ({ useHeist: vi.fn() }))

vi.mock("@/hooks/useHeist", () => ({ default: useHeist }))

// component imports
import HeistDetails from "@/components/HeistDetails"

const heist = {
  id: "h1",
  title: "Swap the office plant",
  description: "Replace it with a convincing fake",
  createdByCodename: "ShadowFox",
  assignedToCodename: "QuietOwl",
  createdAt: new Date(),
  deadline: new Date(Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000),
  createdBy: "u1",
  assignedTo: "u2",
  finalStatus: null,
}

describe("HeistDetails", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("asks the hook for the given heist", () => {
    useHeist.mockReturnValue({ heist, loading: false, error: null })

    render(<HeistDetails id="h1" />)

    expect(useHeist).toHaveBeenCalledWith("h1")
  })

  it("shows the title, people, description and time remaining", () => {
    useHeist.mockReturnValue({ heist, loading: false, error: null })

    render(<HeistDetails id="h1" />)

    expect(
      screen.getByRole("heading", { name: "Swap the office plant" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Assigned to")).toBeInTheDocument()
    expect(screen.getByText("QuietOwl")).toBeInTheDocument()
    expect(screen.getByText("Created by")).toBeInTheDocument()
    expect(screen.getByText("ShadowFox")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Mission Details" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Replace it with a convincing fake"),
    ).toBeInTheDocument()
    expect(screen.getByText("5 hours remaining")).toBeInTheDocument()
  })

  it("shows the created and deadline dates", () => {
    useHeist.mockReturnValue({
      heist: {
        ...heist,
        createdAt: new Date(2026, 0, 27, 9, 27),
        deadline: new Date(2026, 0, 31, 9, 27),
      },
      loading: false,
      error: null,
    })

    render(<HeistDetails id="h1" />)

    expect(screen.getByText("Jan 27, 09:27 AM")).toBeInTheDocument()
    expect(screen.getByText("Sat, Jan 31, 2026, 09:27 AM")).toBeInTheDocument()
  })

  it("shows Overdue once the deadline has passed", () => {
    useHeist.mockReturnValue({
      heist: { ...heist, deadline: new Date(2020, 0, 1) },
      loading: false,
      error: null,
    })

    render(<HeistDetails id="h1" />)

    expect(screen.getByText("Overdue")).toBeInTheDocument()
  })

  it("shows a loading state", () => {
    useHeist.mockReturnValue({ heist: null, loading: true, error: null })

    render(<HeistDetails id="h1" />)

    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("shows a message when the heist isn't found", () => {
    useHeist.mockReturnValue({ heist: null, loading: false, error: null })

    render(<HeistDetails id="nope" />)

    expect(screen.getByText(/heist not found/i)).toBeInTheDocument()
  })

  it("shows an alert when loading fails", () => {
    useHeist.mockReturnValue({
      heist: null,
      loading: false,
      error: new Error("denied"),
    })

    render(<HeistDetails id="h1" />)

    expect(screen.getByRole("alert")).toBeInTheDocument()
  })
})
