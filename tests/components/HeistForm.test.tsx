import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { collection, getDocs, addDoc, serverTimestamp, push, useUser } =
  vi.hoisted(() => ({
    collection: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    push: vi.fn(),
    useUser: vi.fn(),
  }))

vi.mock("firebase/firestore", () => ({ collection, getDocs, addDoc, serverTimestamp }))
vi.mock("@/lib/firebase", () => ({ db: {} }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("@/components/AuthProvider", () => ({ useUser }))

// component imports
import HeistForm from "@/components/HeistForm"

const SERVER_TIME = { sentinel: "serverTimestamp" }

function userDocs(...users: { id: string; codename?: unknown }[]) {
  return { docs: users.map((u) => ({ data: () => u })) }
}

async function fillAndSubmit({
  title = "Swap the office plant",
  description = "Replace it with a convincing fake",
  assignee = "Brass",
}: { title?: string; description?: string; assignee?: string } = {}) {
  const user = userEvent.setup()
  // wait for the assignee list to load
  await screen.findByRole("option", { name: "BraveBrassFox" })
  if (title) await user.type(screen.getByLabelText("Title"), title)
  if (description)
    await user.type(screen.getByLabelText("Description"), description)
  if (assignee === "Brass")
    await user.selectOptions(screen.getByLabelText("Assign to"), "u2")
  await user.click(screen.getByRole("button", { name: "Create heist" }))
}

describe("HeistForm", () => {
  beforeEach(() => {
    useUser.mockReturnValue({
      user: { uid: "u1", displayName: "SilentCopperFox" },
    })
    collection.mockImplementation((_db, name) => `collection:${name}`)
    getDocs.mockResolvedValue(
      userDocs(
        { id: "u3", codename: "WittyNeonRaven" },
        { id: "u1", codename: "SilentCopperFox" },
        { id: "u2", codename: "BraveBrassFox" },
        { id: "u4" },
      ),
    )
    addDoc.mockResolvedValue({ id: "h1" })
    serverTimestamp.mockReturnValue(SERVER_TIME)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it("shows a loading state in the assignee select while users load", () => {
    getDocs.mockReturnValue(new Promise(() => {}))
    render(<HeistForm />)

    expect(screen.getByLabelText("Assign to")).toBeDisabled()
    expect(screen.getByText("Loading crew…")).toBeInTheDocument()
  })

  it("lists other users sorted by codename, without the signed-in user", async () => {
    render(<HeistForm />)

    await screen.findByRole("option", { name: "BraveBrassFox" })
    const names = screen
      .getAllByRole("option")
      .map((option) => option.textContent)
      .filter((name) => name !== "Choose a crew member")
    expect(names).toEqual(["BraveBrassFox", "WittyNeonRaven"])
  })

  it("shows an error and a retry button when users fail to load", async () => {
    getDocs.mockRejectedValueOnce({ code: "permission-denied" })
    const user = userEvent.setup()
    render(<HeistForm />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "couldn't load",
    )

    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByRole("option", { name: "BraveBrassFox" }),
    ).toBeInTheDocument()
  })

  it("explains when there is nobody to assign to and blocks submit", async () => {
    getDocs.mockResolvedValue(userDocs({ id: "u1", codename: "SilentCopperFox" }))
    render(<HeistForm />)

    expect(await screen.findByText(/no one else has joined/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create heist" })).toBeDisabled()
  })

  it("blocks an empty title", async () => {
    render(<HeistForm />)

    await fillAndSubmit({ title: "" })

    expect(await screen.findByRole("alert")).toHaveTextContent(/title/i)
    expect(addDoc).not.toHaveBeenCalled()
  })

  it("blocks a whitespace-only description", async () => {
    render(<HeistForm />)

    await fillAndSubmit({ description: "   " })

    expect(await screen.findByRole("alert")).toHaveTextContent(/description/i)
    expect(addDoc).not.toHaveBeenCalled()
  })

  it("blocks a submit with no assignee chosen", async () => {
    render(<HeistForm />)

    await fillAndSubmit({ assignee: "" })

    expect(await screen.findByRole("alert")).toHaveTextContent(/assign/i)
    expect(addDoc).not.toHaveBeenCalled()
  })

  it("saves the heist with entered and generated fields", async () => {
    render(<HeistForm />)

    await fillAndSubmit()

    expect(collection).toHaveBeenCalledWith({}, "heists")
    expect(addDoc).toHaveBeenCalledTimes(1)
    expect(addDoc).toHaveBeenCalledWith(
      "collection:heists",
      expect.objectContaining({
        title: "Swap the office plant",
        description: "Replace it with a convincing fake",
        createdBy: "u1",
        createdByCodename: "SilentCopperFox",
        assignedTo: "u2",
        assignedToCodename: "BraveBrassFox",
        createdAt: SERVER_TIME,
        finalStatus: null,
      }),
    )
  })

  it("sets the deadline exactly 48 hours after submitting", async () => {
    const now = new Date("2026-10-13T10:00:00Z")
    render(<HeistForm />)
    await screen.findByRole("option", { name: "BraveBrassFox" })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Title"), "Swap the office plant")
    await user.type(screen.getByLabelText("Description"), "A convincing fake")
    await user.selectOptions(screen.getByLabelText("Assign to"), "u2")

    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(now)
    await user.click(screen.getByRole("button", { name: "Create heist" }))

    const saved = addDoc.mock.calls[0][1]
    expect(saved.deadline).toEqual(new Date("2026-10-15T10:00:00Z"))
  })

  it("trims the title and description before saving", async () => {
    render(<HeistForm />)

    await fillAndSubmit({ title: "  Plant swap  ", description: "  A fake  " })

    expect(addDoc.mock.calls[0][1]).toMatchObject({
      title: "Plant swap",
      description: "A fake",
    })
  })

  it("redirects to /heists after a successful save", async () => {
    render(<HeistForm />)

    await fillAndSubmit()

    expect(push).toHaveBeenCalledWith("/heists")
  })

  it("shows an error, keeps the values and does not redirect when saving fails", async () => {
    addDoc.mockRejectedValue({ code: "permission-denied" })
    render(<HeistForm />)

    await fillAndSubmit()

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByLabelText("Title")).toHaveValue("Swap the office plant")
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Replace it with a convincing fake",
    )
    expect(screen.getByRole("button", { name: "Create heist" })).toBeEnabled()
    expect(push).not.toHaveBeenCalled()
  })

  it("disables the submit button while the save is pending", async () => {
    addDoc.mockReturnValue(new Promise(() => {}))
    render(<HeistForm />)

    await fillAndSubmit()

    expect(
      screen.getByRole("button", { name: "Creating heist…" }),
    ).toBeDisabled()
  })

  it("does not save when the signed-in user's display name is missing", async () => {
    useUser.mockReturnValue({ user: { uid: "u1", displayName: null } })
    render(<HeistForm />)

    await fillAndSubmit()

    expect(await screen.findByRole("alert")).toHaveTextContent(/profile/i)
    expect(addDoc).not.toHaveBeenCalled()
  })
})
