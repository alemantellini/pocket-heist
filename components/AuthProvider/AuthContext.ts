import { createContext } from "react"

export type AppUser = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export type AuthState = {
  user: AppUser | null
  loading: boolean
}

export type AuthContextValue = AuthState & {
  // true while the signup form is still writing the profile, so route guards
  // don't redirect the new (already authenticated) user too early
  pendingSignup: boolean
  setPendingSignup: (value: boolean) => void
}

// null default lets useUser detect usage outside the provider
export const AuthContext = createContext<AuthContextValue | null>(null)
