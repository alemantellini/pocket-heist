"use client"

import { onAuthStateChanged } from "firebase/auth"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { AuthContext, type AuthState } from "./AuthContext"

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    return onAuthStateChanged(
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

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
