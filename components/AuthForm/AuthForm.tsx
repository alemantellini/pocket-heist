"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
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

export default function AuthForm({ mode }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const copy = COPY[mode]

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)

    // temporary placeholder until real authentication is wired in
    console.log({ email: data.get("email"), password: data.get("password") })
  }

  return (
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
        <label htmlFor={`${mode}-password`}>Password</label>
        <div className={styles.passwordWrapper}>
          <input
            id={`${mode}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={copy.autoComplete}
            required
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
      </div>

      <button type="submit" className="btn">
        {copy.submit}
      </button>

      <p className={styles.switch}>
        {copy.prompt} <Link href={copy.switchHref}>{copy.switchLabel}</Link>
      </p>
    </form>
  )
}
