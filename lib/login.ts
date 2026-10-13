import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"

// resolves with the signed-in user's display name; useUser updates through the
// global auth listener
export async function logIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)

  return user.displayName
}
