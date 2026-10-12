"use client"

import { signOut } from "firebase/auth"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { useUser } from "@/components/AuthProvider"
import { auth } from "@/lib/firebase"
import styles from "./LogoutButton.module.css"

// renders its own <li> so nothing is left behind in the navbar list when hidden
export default function LogoutButton() {
  const { user, loading } = useUser()
  const [pending, setPending] = useState(false)

  if (loading || !user) return null

  async function handleClick() {
    setPending(true)

    try {
      await signOut(auth)
    } catch (error) {
      // the user stays signed in and can try again
      console.error(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <li>
      <button
        type="button"
        className={styles.logout}
        disabled={pending}
        onClick={handleClick}
      >
        <LogOut size={18} aria-hidden="true" />
        Log out
      </button>
    </li>
  )
}
