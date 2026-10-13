"use client"

import { onIdTokenChanged } from "firebase/auth"
import { useEffect, useMemo, useState } from "react"
import { auth } from "@/lib/firebase"
import { AuthContext, type AuthState } from "./AuthContext"

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })
  const [pendingSignup, setPendingSignup] = useState(false)

  useEffect(() => {
    // onIdTokenChanged also fires on token refresh, which is how a changed
    // displayName reaches consumers
    return onIdTokenChanged(
      auth,
      (firebaseUser) => {
        setState({
          user: firebaseUser
            ? {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              }
            : null,
          loading: false,
        })
      },
      // don't leave consumers loading forever if the session can't be restored
      () => setState({ user: null, loading: false }),
    )
  }, [])

  const value = useMemo(
    () => ({ ...state, pendingSignup, setPendingSignup }),
    [state, pendingSignup],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
