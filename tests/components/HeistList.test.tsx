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

  it("lists only the heist titles for expired heists", () => {
    useHeists.mockReturnValue({ heists, loading: false, error: null })

    render(<HeistList type="expired" />)

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(
      ["Swap the office plant", "Jelly in the stapler"],
    )
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(screen.queryByText("Secret details")).not.toBeInTheDocument()
  })

  it("shows a loading message for expired heists while loading", () => {
    useHeists.mockReturnValue({ heists: [], loading: true, error: null })

    render(<HeistList type="expired" />)

    expect(screen.getByText("Loading heists…")).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it.each(["active", "assigned"] as const)(
    "shows a row of skeleton cards while loading %s heists",
    (type) => {
      useHeists.mockReturnValue({ heists: [], loading: true, error: null })

      render(<HeistList type={type} />)

      expect(screen.getAllByTestId("heist-card-skeleton")).toHaveLength(3)
      expect(screen.queryByText("Loading heists…")).not.toBeInTheDocument()
    },
  )

  it.each(["active", "assigned"] as const)(
    "shows a card linking to each %s heist",
    (type) => {
      useHeists.mockReturnValue({
        heists: heists.map((heist) => ({
          ...heist,
          createdByCodename: "shadowfox",
          assignedToCodename: "quietowl",
          deadline: new Date(Date.now() + 5 * 60 * 60 * 1000),
        })),
        loading: false,
        error: null,
      })

      render(<HeistList type={type} />)

      expect(screen.getAllByRole("listitem")).toHaveLength(2)
      expect(
        screen.getByRole("link", { name: "Swap the office plant" }),
      ).toHaveAttribute("href", "/heists/h1")
      expect(
        screen.getByRole("link", { name: "Jelly in the stapler" }),
      ).toHaveAttribute("href", "/heists/h2")
      expect(screen.queryByTestId("heist-card-skeleton")).not.toBeInTheDocument()
    },
  )

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
