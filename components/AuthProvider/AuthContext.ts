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

// null default lets useUser detect usage outside the provider
export const AuthContext = createContext<AuthState | null>(null)
