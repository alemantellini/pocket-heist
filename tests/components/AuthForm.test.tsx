import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, afterEach } from "vitest"

// component imports
import AuthForm from "@/components/AuthForm"

describe("AuthForm", () => {
  afterEach(() => {
    vi.restoreAllMocks()
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

  it("logs the entered email and password on submit", async () => {
    const user = userEvent.setup()
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    render(<AuthForm mode="login" />)

    await user.type(screen.getByLabelText("Email"), "mario@example.com")
    await user.type(screen.getByLabelText("Password"), "secret123")
    await user.click(screen.getByRole("button", { name: "Log in" }))

    expect(log).toHaveBeenCalledWith({
      email: "mario@example.com",
      password: "secret123",
    })
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
  })

  it("submits a signup password of 8 or more characters", async () => {
    const user = userEvent.setup()
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    render(<AuthForm mode="signup" />)

    await user.type(screen.getByLabelText("Email"), "mario@example.com")
    await user.type(screen.getByLabelText("Password"), "longenough")
    await user.click(screen.getByRole("button", { name: "Sign up" }))

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(log).toHaveBeenCalledWith({
      email: "mario@example.com",
      password: "longenough",
    })
  })

  it("does not enforce a minimum length on login", async () => {
    const user = userEvent.setup()
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    render(<AuthForm mode="login" />)

    await user.type(screen.getByLabelText("Email"), "mario@example.com")
    await user.type(screen.getByLabelText("Password"), "short")
    await user.click(screen.getByRole("button", { name: "Log in" }))

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(log).toHaveBeenCalled()
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
