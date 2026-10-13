import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"

const { useHeists } = vi.hoisted(() => ({ useHeists: vi.fn() }))

vi.mock("@/hooks/useHeists", () => ({ default: useHeists }))

// component imports
import HeistList from "@/components/HeistList"

const heists = [
  { id: "h1", title: "Swap the office plant", description: "Secret details" },
  { id: "h2", title: "Jelly in the stapler", description: "More secrets" },
]

describe("HeistList", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("asks the hook for the requested type", () => {
    useHeists.mockReturnValue({ heists: [], loading: false, error: null })

    render(<HeistList type="expired" />)

    expect(useHeists).toHaveBeenCalledWith("expired")
  })

  it("lists only the heist titles", () => {
    useHeists.mockReturnValue({ heists, loading: false, error: null })

    render(<HeistList type="active" />)

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(
      ["Swap the office plant", "Jelly in the stapler"],
    )
    expect(screen.queryByText("Secret details")).not.toBeInTheDocument()
  })

  it("shows a loading message while loading", () => {
    useHeists.mockReturnValue({ heists: [], loading: true, error: null })

    render(<HeistList type="active" />)

    expect(screen.getByText("Loading heists…")).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it.each([
    ["active", "No active heists"],
    ["assigned", "No heists assigned yet"],
    ["expired", "No expired heists"],
  ] as const)("shows an empty message for %s", (type, message) => {
    useHeists.mockReturnValue({ heists: [], loading: false, error: null })

    render(<HeistList type={type} />)

    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it("shows an error message when the listener fails", () => {
    useHeists.mockReturnValue({
      heists: [],
      loading: false,
      error: { code: "failed-precondition" },
    })

    render(<HeistList type="expired" />)

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load/i)
  })
})
