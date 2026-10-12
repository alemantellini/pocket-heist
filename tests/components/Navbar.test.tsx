import { render, screen } from "@testing-library/react"
import { beforeEach, describe, it, expect, vi } from "vitest"

const { useUser } = vi.hoisted(() => ({ useUser: vi.fn() }))

vi.mock("firebase/auth", () => ({ signOut: vi.fn() }))
vi.mock("@/lib/firebase", () => ({ auth: {} }))
vi.mock("@/components/AuthProvider", () => ({ useUser }))

// component imports
import Navbar from "@/components/Navbar"

describe("Navbar", () => {
  beforeEach(() => {
    useUser.mockReturnValue({ user: null, loading: false })
  })

  it("renders the main heading", () => {
    render(<Navbar />)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toBeInTheDocument()
  })

  it("renders the Create New Heist link", () => {
    render(<Navbar />)

    const createLink = screen.getByRole("link", { name: /create new heist/i })
    expect(createLink).toBeInTheDocument()
    expect(createLink).toHaveAttribute("href", "/heists/create")
  })

  it("hides the Log out button when signed out", () => {
    render(<Navbar />)

    expect(
      screen.queryByRole("button", { name: "Log out" }),
    ).not.toBeInTheDocument()
  })

  it("shows the Log out button before Create New Heist when signed in", () => {
    useUser.mockReturnValue({
      user: { uid: "u1", email: null, displayName: null, photoURL: null },
      loading: false,
    })
    render(<Navbar />)

    const logout = screen.getByRole("button", { name: "Log out" })
    const createLink = screen.getByRole("link", { name: /create new heist/i })
    expect(
      logout.compareDocumentPosition(createLink) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
