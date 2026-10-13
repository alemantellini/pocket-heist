import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { generateCodename } from "@/lib/codename"
import { auth, db } from "@/lib/firebase"

const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists",
  "auth/invalid-email": "Please enter a valid email address",
  "auth/weak-password": "That password is too weak, try a longer one",
  "auth/network-request-failed":
    "Network error, check your connection and try again",
  // one message for wrong password and unknown email so neither is revealed
  "auth/invalid-credential": "Incorrect email or password",
  "auth/wrong-password": "Incorrect email or password",
  "auth/user-not-found": "Incorrect email or password",
  "auth/too-many-requests":
    "Too many attempts, please wait a moment and try again",
  "auth/user-disabled": "This account has been disabled",
  "permission-denied": "We couldn't save your profile, please try again",
}

export function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : ""

  return ERROR_MESSAGES[code] ?? "Something went wrong, please try again"
}

// no rollback if a later step fails: the account is kept and the error is
// surfaced; the users document write is safe to repeat (setDoc on users/{uid})
export async function signUp(email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  const codename = generateCodename()

  await updateProfile(user, { displayName: codename })

  // explicit fields only so the email can never end up in the document
  await setDoc(doc(db, "users", user.uid), { id: user.uid, codename })

  // updateProfile doesn't notify auth listeners, so force a token refresh to
  // make useUser pick up the new displayName
  await user.getIdToken(true)
}
