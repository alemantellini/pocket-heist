import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { unsubscribe, onIdTokenChanged } = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  onIdTokenChanged: vi.fn(),
}))

vi.mock("firebase/auth", () => ({ onIdTokenChanged }))
vi.mock("@/lib/firebase", () => ({ auth: {} }))

// component imports
import AuthProvider, { useUser } from "@/components/AuthProvider"

type AuthCallback = (user: unknown) => void

function emit(user: unknown) {
  const callback = onIdTokenChanged.mock.calls[0][1] as AuthCallback
  act(() => callback(user))
}

function Consumer() {
  const { user, loading } = useUser()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{JSON.stringify(user)}</span>
    </div>
  )
}

function renderWithProvider(consumers = 1) {
  return render(
    <AuthProvider>
      {Array.from({ length: consumers }, (_, i) => (
        <Consumer key={i} />
      ))}
    </AuthProvider>,
  )
}

describe("AuthProvider / useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onIdTokenChanged.mockReturnValue(unsubscribe)
  })

  it("reports loading until the first auth callback fires", () => {
    renderWithProvider()

    expect(screen.getByTestId("loading")).toHaveTextContent("true")
    expect(screen.getByTestId("user")).toHaveTextContent("null")

    emit(null)

    expect(screen.getByTestId("loading")).toHaveTextContent("false")
  })

  it("returns null when signed out", () => {
    renderWithProvider()
    emit(null)

    expect(screen.getByTestId("user")).toHaveTextContent("null")
  })

  it("returns only the trimmed user shape when signed in", () => {
    renderWithProvider()
    emit({
      uid: "abc",
      email: "a@b.com",
      displayName: "Ale",
      photoURL: null,
      getIdToken: vi.fn(),
    })

    expect(JSON.parse(screen.getByTestId("user").textContent!)).toEqual({
      uid: "abc",
      email: "a@b.com",
      displayName: "Ale",
      photoURL: null,
    })
  })

  it("updates consumers when auth state changes", () => {
    renderWithProvider()
    emit({ uid: "abc", email: null, displayName: null, photoURL: null })
    expect(screen.getByTestId("user")).toHaveTextContent("abc")

    emit(null)
    expect(screen.getByTestId("user")).toHaveTextContent("null")
  })

  it("subscribes once and unsubscribes on unmount", () => {
    const { unmount } = renderWithProvider(2)

    expect(onIdTokenChanged).toHaveBeenCalledTimes(1)
    expect(unsubscribe).not.toHaveBeenCalled()

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it("stops loading if the listener reports an error", () => {
    renderWithProvider()
    const onError = onIdTokenChanged.mock.calls[0][2] as () => void
    act(() => onError())

    expect(screen.getByTestId("loading")).toHaveTextContent("false")
    expect(screen.getByTestId("user")).toHaveTextContent("null")
  })

  it("throws when used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<Consumer />)).toThrow(
      "useUser must be used within an AuthProvider",
    )

    spy.mockRestore()
  })
})
