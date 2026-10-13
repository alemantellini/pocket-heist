import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"

// useUser updates through the global auth listener, and route guards handle
// the redirect afterwards
export async function logIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password)
}
