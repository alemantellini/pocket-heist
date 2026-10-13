import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { useUser, replace } = vi.hoisted(() => ({
  useUser: vi.fn(),
  replace: vi.fn(),
}))

vi.mock("@/components/AuthProvider", () => ({ useUser }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }))

// component imports
import RouteGuard from "@/components/RouteGuard"

const signedIn = { uid: "u1", email: null, displayName: null, photoURL: null }

function setAuth(
  user: typeof signedIn | null,
  { loading = false, pendingSignup = false } = {},
) {
  useUser.mockReturnValue({ user, loading, pendingSignup })
}

function renderGuard(require: "user" | "guest") {
  return render(
    <RouteGuard require={require}>
      <p>page content</p>
    </RouteGuard>,
  )
}

describe("RouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(["user", "guest"] as const)(
    "shows only the loader while auth is loading (%s)",
    (require) => {
      setAuth(null, { loading: true })
      renderGuard(require)

      expect(screen.getByRole("status")).toBeInTheDocument()
      expect(screen.queryByText("page content")).not.toBeInTheDocument()
      expect(replace).not.toHaveBeenCalled()
    },
  )

  it("redirects a signed-out visitor from a protected page to /login", () => {
    setAuth(null)
    renderGuard("user")

    expect(replace).toHaveBeenCalledWith("/login")
    expect(screen.queryByText("page content")).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("renders protected content for a signed-in user", () => {
    setAuth(signedIn)
    renderGuard("user")

    expect(screen.getByText("page content")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it("redirects a signed-in user from a public page to /heists", () => {
    setAuth(signedIn)
    renderGuard("guest")

    expect(replace).toHaveBeenCalledWith("/heists")
    expect(screen.queryByText("page content")).not.toBeInTheDocument()
  })

  it("renders public content for a signed-out visitor", () => {
    setAuth(null)
    renderGuard("guest")

    expect(screen.getByText("page content")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it("does not redirect a signed-in user while a signup is pending", () => {
    setAuth(signedIn, { pendingSignup: true })
    renderGuard("guest")

    expect(screen.getByText("page content")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })
})
