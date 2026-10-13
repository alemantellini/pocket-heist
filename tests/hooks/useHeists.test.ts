import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { collection, query, where, orderBy, onSnapshot, now, useUser } =
  vi.hoisted(() => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    now: vi.fn(),
    useUser: vi.fn(),
  }))

vi.mock("firebase/firestore", () => ({
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp: { now },
}))
vi.mock("@/lib/firebase", () => ({ db: {} }))
vi.mock("@/components/AuthProvider", () => ({ useUser }))

// hook imports
import useHeists from "@/hooks/useHeists"

const NOW = { seconds: 1760000000, tag: "now" }
const unsubscribe = vi.fn()

// the next/error callbacks passed to the most recent onSnapshot call
function lastListener() {
  const [, next, error] = onSnapshot.mock.calls.at(-1)!
  return {
    next: next as (snapshot: unknown) => void,
    error: error as (error: unknown) => void,
  }
}

function snapshotOf(...titles: string[]) {
  return {
    docs: titles.map((title) => ({ data: () => ({ id: title, title }) })),
  }
}

describe("useHeists", () => {
  beforeEach(() => {
    // testing-library unmounts after afterEach hooks run, so the previous
    // test's unsubscribe call must be cleared here, not only afterwards
    vi.clearAllMocks()
    useUser.mockReturnValue({ user: { uid: "u1" } })
    collection.mockReturnValue({
      withConverter: () => "heists-collection",
    })
    query.mockImplementation((base, ...constraints) => ({ base, constraints }))
    where.mockImplementation((...args) => ["where", ...args])
    orderBy.mockImplementation((...args) => ["orderBy", ...args])
    onSnapshot.mockReturnValue(unsubscribe)
    now.mockReturnValue(NOW)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it("queries heists assigned to the user with a future deadline for active", () => {
    renderHook(() => useHeists("active"))

    expect(collection).toHaveBeenCalledWith({}, "heists")
    expect(query).toHaveBeenCalledWith(
      "heists-collection",
      ["where", "assignedTo", "==", "u1"],
      ["where", "deadline", ">", NOW],
      ["orderBy", "deadline", "asc"],
    )
  })

  it("queries heists created by the user, newest first, for assigned", () => {
    renderHook(() => useHeists("assigned"))

    expect(query).toHaveBeenCalledWith(
      "heists-collection",
      ["where", "createdBy", "==", "u1"],
      ["orderBy", "createdAt", "desc"],
    )
  })

  it("queries all past deadlines, whatever the final status, for any user, for expired", () => {
    renderHook(() => useHeists("expired"))

    expect(query).toHaveBeenCalledWith(
      "heists-collection",
      ["where", "deadline", "<", NOW],
      ["orderBy", "deadline", "desc"],
    )
    expect(where).not.toHaveBeenCalledWith("finalStatus", expect.anything(), expect.anything())
    expect(where).not.toHaveBeenCalledWith("assignedTo", "==", expect.anything())
    expect(where).not.toHaveBeenCalledWith("createdBy", "==", expect.anything())
  })

  it("starts loading with an empty array", () => {
    const { result } = renderHook(() => useHeists("active"))

    expect(result.current).toEqual({ heists: [], loading: true, error: null })
  })

  it("returns the heists from the snapshot and updates on new snapshots", () => {
    const { result } = renderHook(() => useHeists("active"))

    act(() => lastListener().next(snapshotOf("Plant swap")))

    expect(result.current.loading).toBe(false)
    expect(result.current.heists.map((heist) => heist.title)).toEqual([
      "Plant swap",
    ])

    act(() => lastListener().next(snapshotOf("Plant swap", "Stapler jelly")))

    expect(result.current.heists.map((heist) => heist.title)).toEqual([
      "Plant swap",
      "Stapler jelly",
    ])
  })

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useHeists("active"))

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it("resubscribes and drops old results when the type changes", () => {
    const { result, rerender } = renderHook(({ type }) => useHeists(type), {
      initialProps: { type: "active" as "active" | "expired" },
    })
    act(() => lastListener().next(snapshotOf("Plant swap")))

    rerender({ type: "expired" })

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(onSnapshot).toHaveBeenCalledTimes(2)
    expect(result.current).toEqual({ heists: [], loading: true, error: null })
  })

  it("does not subscribe without a signed-in user", () => {
    useUser.mockReturnValue({ user: null })

    const { result } = renderHook(() => useHeists("active"))

    expect(onSnapshot).not.toHaveBeenCalled()
    expect(result.current).toEqual({ heists: [], loading: true, error: null })
  })

  it("returns an empty array and the error when the listener fails", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const failure = { code: "permission-denied" }
    const { result } = renderHook(() => useHeists("expired"))

    act(() => lastListener().error(failure))

    expect(result.current).toEqual({
      heists: [],
      loading: false,
      error: failure,
    })
    expect(log).toHaveBeenCalled()
  })
})
