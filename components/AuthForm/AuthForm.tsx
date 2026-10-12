"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { getAuthErrorMessage, signUp } from "@/lib/signup"
import styles from "./AuthForm.module.css"

type AuthFormProps = {
  mode: "login" | "signup"
}

const COPY = {
  login: {
    submit: "Log in",
    prompt: "Don't have an account?",
    switchLabel: "Sign up",
    switchHref: "/signup",
    autoComplete: "current-password",
  },
  signup: {
    submit: "Sign up",
    prompt: "Already have an account?",
    switchLabel: "Log in",
    switchHref: "/login",
    autoComplete: "new-password",
  },
} as const

// signup only; the server must enforce the same minimum once auth exists
const MIN_PASSWORD_LENGTH = 8

export default function AuthForm({ mode }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)
  const copy = COPY[mode]
  const passwordId = `${mode}-password`
  const errorId = `${passwordId}-error`

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = String(data.get("email") ?? "")
    const password = String(data.get("password") ?? "")

    if (mode === "signup" && password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      )
      return
    }

    setPasswordError("")

    if (mode === "login") {
      // temporary placeholder until the login flow is wired in
      console.log({ email, password })
      return
    }

    setFormError("")
    setPending(true)

    try {
      await signUp(email, password)
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={styles.authForm}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor={`${mode}-email`}>Email</label>
          <input
            id={`${mode}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={passwordId}>Password</label>
          <div className={styles.passwordWrapper}>
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={copy.autoComplete}
              required
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? errorId : undefined}
              onChange={() => passwordError && setPasswordError("")}
            />
            <button
              type="button"
              className={styles.toggle}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && (
            <p id={errorId} role="alert" className={styles.error}>
              {passwordError}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className={styles.error}>
            {formError}
          </p>
        )}

        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Signing up…" : copy.submit}
        </button>
      </form>

      <p className={styles.switch}>
        {copy.prompt} <Link href={copy.switchHref}>{copy.switchLabel}</Link>
      </p>
    </div>
  )
}
