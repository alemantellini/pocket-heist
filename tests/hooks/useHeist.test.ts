import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const { doc, onSnapshot } = vi.hoisted(() => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
}))

vi.mock("firebase/firestore", () => ({ doc, onSnapshot }))
vi.mock("@/lib/firebase", () => ({ db: {} }))

// hook imports
import useHeist from "@/hooks/useHeist"

const unsubscribe = vi.fn()

function lastListener() {
  const [, next, error] = onSnapshot.mock.calls.at(-1)!
  return {
    next: next as (snapshot: unknown) => void,
    error: error as (error: unknown) => void,
  }
}

describe("useHeist", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    doc.mockReturnValue({ withConverter: () => "heist-ref" })
    onSnapshot.mockReturnValue(unsubscribe)
  })

  it("subscribes to the heist document with the given id", () => {
    renderHook(() => useHeist("h1"))

    expect(doc).toHaveBeenCalledWith({}, "heists", "h1")
    expect(onSnapshot).toHaveBeenCalledWith(
      "heist-ref",
      expect.any(Function),
      expect.any(Function),
    )
  })

  it("starts loading", () => {
    const { result } = renderHook(() => useHeist("h1"))

    expect(result.current).toEqual({ heist: null, loading: true, error: null })
  })

  it("returns the heist from the snapshot", () => {
    const { result } = renderHook(() => useHeist("h1"))

    act(() =>
      lastListener().next({
        exists: () => true,
        data: () => ({ id: "h1", title: "Plant swap" }),
      }),
    )

    expect(result.current.heist).toEqual({ id: "h1", title: "Plant swap" })
    expect(result.current.loading).toBe(false)
  })

  it("returns null once loaded when the heist doesn't exist", () => {
    const { result } = renderHook(() => useHeist("missing"))

    act(() => lastListener().next({ exists: () => false }))

    expect(result.current).toEqual({ heist: null, loading: false, error: null })
  })

  it("returns the error when the listener fails", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { result } = renderHook(() => useHeist("h1"))
    const failure = new Error("denied")

    act(() => lastListener().error(failure))

    expect(result.current.error).toBe(failure)
    expect(result.current.loading).toBe(false)
  })

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useHeist("h1"))

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})
