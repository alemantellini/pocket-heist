import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { signOut, useUser } = vi.hoisted(() => ({
  signOut: vi.fn(),
  useUser: vi.fn(),
}))

vi.mock("firebase/auth", () => ({ signOut }))
vi.mock("@/lib/firebase", () => ({ auth: { name: "auth" } }))
vi.mock("@/components/AuthProvider", () => ({ useUser }))

// component imports
import LogoutButton from "@/components/LogoutButton"

const signedIn = {
  user: { uid: "u1", email: null, displayName: null, photoURL: null },
  loading: false,
}

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUser.mockReturnValue(signedIn)
    signOut.mockResolvedValue(undefined)
  })

  it("renders a Log out button for a signed-in user", () => {
    render(<LogoutButton />)

    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument()
  })

  it("renders nothing when signed out", () => {
    useUser.mockReturnValue({ user: null, loading: false })
    const { container } = render(<LogoutButton />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing while auth is loading", () => {
    useUser.mockReturnValue({ user: null, loading: true })
    const { container } = render(<LogoutButton />)

    expect(container).toBeEmptyDOMElement()
  })

  it("signs out when clicked", async () => {
    const user = userEvent.setup()
    render(<LogoutButton />)

    await user.click(screen.getByRole("button", { name: "Log out" }))

    expect(signOut).toHaveBeenCalledWith({ name: "auth" })
  })

  it("is disabled while sign-out is pending", async () => {
    signOut.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<LogoutButton />)

    await user.click(screen.getByRole("button", { name: "Log out" }))

    expect(screen.getByRole("button", { name: "Log out" })).toBeDisabled()
  })

  it("logs the error and re-enables the button if sign-out fails", async () => {
    const error = new Error("network")
    signOut.mockRejectedValue(error)
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const user = userEvent.setup()
    render(<LogoutButton />)

    await user.click(screen.getByRole("button", { name: "Log out" }))

    expect(log).toHaveBeenCalledWith(error)
    expect(screen.getByRole("button", { name: "Log out" })).toBeEnabled()
    log.mockRestore()
  })
})
