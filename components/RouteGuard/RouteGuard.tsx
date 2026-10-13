"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import AuthLoader from "@/components/AuthLoader"
import { useUser } from "@/components/AuthProvider"

type RouteGuardProps = {
  // "user": signed-in users only, "guest": signed-out visitors only
  require: "user" | "guest"
  children: React.ReactNode
}

export default function RouteGuard({ require, children }: RouteGuardProps) {
  const { user, loading, pendingSignup } = useUser()
  const router = useRouter()

  // a signed-in user mid-signup stays on the form until the profile is saved
  const allowed =
    !loading && (require === "user" ? !!user : !user || pendingSignup)

  useEffect(() => {
    if (loading || allowed) return

    router.replace(require === "user" ? "/login" : "/heists")
  }, [loading, allowed, require, router])

  // the loader also covers a pending redirect so the wrong page never flashes
  return allowed ? children : <AuthLoader />
}
