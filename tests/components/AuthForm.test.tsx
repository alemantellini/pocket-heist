import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth"

// component imports
import AuthForm from "@/components/AuthForm"

const push = vi.fn()

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}))
vi.mock("@/lib/firebase", () => ({ auth: { name: "test-auth" } }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const signIn = vi.mocked(signInWithEmailAndPassword)
const signUp = vi.mocked(createUserWithEmailAndPassword)

async function fillAndSubmit(
  buttonName: string,
  email = "mario@example.com",
  password = "longenough",
) {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText("Email"), email)
  await user.type(screen.getByLabelText("Password"), password)
  await user.click(screen.getByRole("button", { name: buttonName }))
}

describe("AuthForm", () => {
  beforeEach(() => {
    push.mockReset()
    signIn.mockReset()
    signUp.mockReset()
    signIn.mockResolvedValue({} as never)
    signUp.mockResolvedValue({} as never)
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

  it("signs in with Firebase and goes to /heists on login", async () => {
    render(<AuthForm mode="login" />)

    await fillAndSubmit("Log in", "mario@example.com", "secret123")

    expect(signIn).toHaveBeenCalledWith(
      { name: "test-auth" },
      "mario@example.com",
      "secret123",
    )
    expect(push).toHaveBeenCalledWith("/heists")
  })

  it("creates an account with Firebase and goes to /heists on signup", async () => {
    render(<AuthForm mode="signup" />)

    await fillAndSubmit("Sign up")

    expect(signUp).toHaveBeenCalledWith(
      { name: "test-auth" },
      "mario@example.com",
      "longenough",
    )
    expect(push).toHaveBeenCalledWith("/heists")
  })

  it("shows an inline error and does not submit a short signup password", async () => {
    render(<AuthForm mode="signup" />)

    await fillAndSubmit("Sign up", "mario@example.com", "short")

    expect(screen.getByRole("alert")).toHaveTextContent("at least 8 characters")
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
    expect(signUp).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it("does not enforce a minimum length on login", async () => {
    render(<AuthForm mode="login" />)

    await fillAndSubmit("Log in", "mario@example.com", "short")

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(signIn).toHaveBeenCalled()
  })

  it("shows a friendly error and stays on the page when login fails", async () => {
    signIn.mockRejectedValue({ code: "auth/invalid-credential" })
    render(<AuthForm mode="login" />)

    await fillAndSubmit("Log in")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect email or password",
    )
    expect(push).not.toHaveBeenCalled()
  })

  it("shows a friendly error when the email is already registered", async () => {
    signUp.mockRejectedValue({ code: "auth/email-already-in-use" })
    render(<AuthForm mode="signup" />)

    await fillAndSubmit("Sign up")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "account with this email already exists",
    )
    expect(push).not.toHaveBeenCalled()
  })

  it("shows a generic error for unexpected failures", async () => {
    signIn.mockRejectedValue(new Error("network down"))
    render(<AuthForm mode="login" />)

    await fillAndSubmit("Log in")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong",
    )
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
