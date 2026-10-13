import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const { createUser, signIn, updateProfile, setDoc, doc, setPendingSignup } =
  vi.hoisted(() => ({
    createUser: vi.fn(),
    signIn: vi.fn(),
    updateProfile: vi.fn(),
    setDoc: vi.fn(),
    doc: vi.fn(),
    setPendingSignup: vi.fn(),
  }))

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: createUser,
  signInWithEmailAndPassword: signIn,
  updateProfile,
}))
vi.mock("firebase/firestore", () => ({ doc, setDoc }))
vi.mock("@/lib/firebase", () => ({ auth: {}, db: {} }))
vi.mock("@/components/AuthProvider", () => ({
  useUser: () => ({ setPendingSignup }),
}))

// component imports
import AuthForm from "@/components/AuthForm"

const firebaseUser = { uid: "u1", email: "mario@example.com", getIdToken: vi.fn() }

async function fillAndSubmitSignup(password = "longenough") {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Email"), "mario@example.com")
  await user.type(screen.getByLabelText("Password"), password)
  await user.click(screen.getByRole("button", { name: "Sign up" }))
}

async function fillAndSubmitLogin(password = "secret123") {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Email"), "mario@example.com")
  await user.type(screen.getByLabelText("Password"), password)
  await user.click(screen.getByRole("button", { name: "Log in" }))
}

describe("AuthForm", () => {
  beforeEach(() => {
    createUser.mockResolvedValue({ user: firebaseUser })
    signIn.mockResolvedValue({ user: { displayName: "SilentCopperFox" } })
    updateProfile.mockResolvedValue(undefined)
    setDoc.mockResolvedValue(undefined)
    doc.mockReturnValue("users/u1")
    firebaseUser.getIdToken.mockResolvedValue("token")
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it("renders email, password and a Log in button in login mode", () => {
    render(<AuthForm mode="login" />)

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email")
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    )
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument()
  })

  it("renders a Sign up button in signup mode", () => {
    render(<AuthForm mode="signup" />)

    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument()
  })

  it("toggles the password between hidden and visible", async () => {
    const user = userEvent.setup()
    render(<AuthForm mode="login" />)

    await user.click(screen.getByRole("button", { name: "Show password" }))

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "Hide password" }))

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    )
  })

  it("signs in with the entered email and password", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    render(<AuthForm mode="login" />)

    await fillAndSubmitLogin()

    expect(signIn).toHaveBeenCalledWith({}, "mario@example.com", "secret123")
    expect(log).not.toHaveBeenCalled()
  })

  it("does not show a success message after login", async () => {
    render(<AuthForm mode="login" />)

    await fillAndSubmitLogin()

    expect(signIn).toHaveBeenCalled()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows one generic error for wrong credentials and keeps the email", async () => {
    signIn.mockRejectedValue({ code: "auth/invalid-credential" })
    render(<AuthForm mode="login" />)

    await fillAndSubmitLogin()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password",
    )
    expect(screen.getByLabelText("Email")).toHaveValue("mario@example.com")
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("disables the button while login is pending", async () => {
    signIn.mockReturnValue(new Promise(() => {}))
    render(<AuthForm mode="login" />)

    await fillAndSubmitLogin()

    expect(screen.getByRole("button", { name: "Logging in…" })).toBeDisabled()
  })

  it("shows an inline error and does not submit a short signup password", async () => {
    const user = userEvent.setup()
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    render(<AuthForm mode="signup" />)

    await user.type(screen.getByLabelText("Email"), "mario@example.com")
    await user.type(screen.getByLabelText("Password"), "short")
    await user.click(screen.getByRole("button", { name: "Sign up" }))

    expect(screen.getByRole("alert")).toHaveTextContent("at least 8 characters")
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
    expect(log).not.toHaveBeenCalled()
    expect(createUser).not.toHaveBeenCalled()
  })

  it("creates the account with the entered email and password", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    render(<AuthForm mode="signup" />)

    await fillAndSubmitSignup()

    expect(createUser).toHaveBeenCalledWith({}, "mario@example.com", "longenough")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(log).not.toHaveBeenCalled()
  })

  it("sets a display name and writes only id and codename to users", async () => {
    render(<AuthForm mode="signup" />)

    await fillAndSubmitSignup()

    const { displayName } = updateProfile.mock.calls[0][1]
    expect(displayName).toMatch(/^([A-Z][a-z]+){3}$/)
    expect(doc).toHaveBeenCalledWith({}, "users", "u1")
    expect(setDoc).toHaveBeenCalledWith("users/u1", {
      id: "u1",
      codename: displayName,
    })
    expect(firebaseUser.getIdToken).toHaveBeenCalledWith(true)
  })

  it("flags a pending signup while signing up, then clears it", async () => {
    render(<AuthForm mode="signup" />)

    await fillAndSubmitSignup()

    expect(setPendingSignup.mock.calls).toEqual([[true], [false]])
  })

  it("clears the pending signup flag when signup fails", async () => {
    createUser.mockRejectedValue({ code: "auth/email-already-in-use" })
    render(<AuthForm mode="signup" />)

    await fillAndSubmitSignup()

    await screen.findByRole("alert")
    expect(setPendingSignup.mock.calls).toEqual([[true], [false]])
  })

  it("does not flag a pending signup on login", async () => {
    render(<AuthForm mode="login" />)

    await fillAndSubmitLogin()

    expect(setPendingSignup).not.toHaveBeenCalled()
  })

  it("shows a readable error when the email is already in use", async () => {
    createUser.mockRejectedValue({ code: "auth/email-already-in-use" })
    render(<AuthForm mode="signup" />)

    await fillAndSubmitSignup()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "already exists",
    )
    expect(screen.getByLabelText("Email")).toHaveValue("mario@example.com")
    expect(screen.getByRole("button", { name: "Sign up" })).toBeEnabled()
    expect(setDoc).not.toHaveBeenCalled()
  })

  it("shows an error if saving the profile fails", async () => {
    setDoc.mockRejectedValue({ code: "permission-denied" })
    render(<AuthForm mode="signup" />)

    await fillAndSubmitSignup()

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign up" })).toBeEnabled()
  })

  it("disables the submit button while signup is pending", async () => {
    createUser.mockReturnValue(new Promise(() => {}))
    render(<AuthForm mode="signup" />)

    await fillAndSubmitSignup()

    expect(screen.getByRole("button", { name: "Signing up…" })).toBeDisabled()
  })

  it("does not enforce a minimum length on login", async () => {
    render(<AuthForm mode="login" />)

    await fillAndSubmitLogin("short")

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(signIn).toHaveBeenCalledWith({}, "mario@example.com", "short")
  })

  it("places the switch link outside the form", () => {
    const { container } = render(<AuthForm mode="login" />)

    expect(container.querySelector("form a")).toBeNull()
  })

  it("links to the signup page from login mode", () => {
    render(<AuthForm mode="login" />)

    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup",
    )
  })

  it("links to the login page from signup mode", () => {
    render(<AuthForm mode="signup" />)

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    )
  })
})
