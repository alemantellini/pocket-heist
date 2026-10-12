"use client"

import { useUser } from "@/components/AuthProvider"
import styles from "./UserStatus.module.css"

// scratch component for checking the auth listener on /preview
export default function UserStatus() {
  const { user, loading } = useUser()

  return (
    <p className={styles.status}>
      {loading ? "Auth: loading…" : user ? `Auth: ${user.email ?? user.uid}` : "Auth: signed out"}
    </p>
  )
}
