import { useContext } from "react"
import { AuthContext } from "./AuthContext"

export default function useUser() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useUser must be used within an AuthProvider")
  }

  return context
}
