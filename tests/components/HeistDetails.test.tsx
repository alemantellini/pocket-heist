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
  createdByCodename: "shadowfox",
  assignedToCodename: "quietowl",
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

  it("shows the title, people, description and time left", () => {
    useHeist.mockReturnValue({ heist, loading: false, error: null })

    render(<HeistDetails id="h1" />)

    expect(
      screen.getByRole("heading", { name: "Swap the office plant" }),
    ).toBeInTheDocument()
    expect(screen.getByText("@quietowl")).toBeInTheDocument()
    expect(screen.getByText("@shadowfox")).toBeInTheDocument()
    expect(
      screen.getByText("Replace it with a convincing fake"),
    ).toBeInTheDocument()
    expect(screen.getByText(/^5h \d+m$/)).toBeInTheDocument()
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
