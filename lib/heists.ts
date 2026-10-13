import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { COLLECTIONS } from "@/types/firestore"
import type { CreateHeistInput, User } from "@/types/firestore"

export const HEIST_DURATION_MS = 48 * 60 * 60 * 1000

export const TITLE_MIN_LENGTH = 3
export const TITLE_MAX_LENGTH = 80
export const DESCRIPTION_MAX_LENGTH = 500

const ERROR_MESSAGES: Record<string, string> = {
  "permission-denied": "You don't have permission to do that",
  unavailable: "Network error, check your connection and try again",
}

export function getHeistErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : ""

  return ERROR_MESSAGES[code] ?? "Something went wrong, please try again"
}

// everyone except the current user, since a heist is handed to someone else
export async function getAssignableUsers(currentUid: string) {
  const snapshot = await getDocs(collection(db, COLLECTIONS.USERS))

  return snapshot.docs
    .map((doc) => doc.data() as Partial<User>)
    .filter(
      (user): user is User =>
        typeof user.id === "string" &&
        typeof user.codename === "string" &&
        user.id !== currentUid,
    )
    .sort((a, b) => a.codename.localeCompare(b.codename))
}

type NewHeist = {
  title: string
  description: string
  assignedTo: string
  assignedToCodename: string
}

type Creator = {
  uid: string
  codename: string
}

export async function createHeist(heist: NewHeist, creator: Creator) {
  // explicit fields only; the deadline is taken at submit time, not page load
  const data: CreateHeistInput = {
    title: heist.title,
    description: heist.description,
    createdBy: creator.uid,
    createdByCodename: creator.codename,
    assignedTo: heist.assignedTo,
    assignedToCodename: heist.assignedToCodename,
    createdAt: serverTimestamp(),
    deadline: new Date(Date.now() + HEIST_DURATION_MS),
    finalStatus: null,
  }

  // plain collection ref: heistConverter.toFirestore doesn't accept the
  // serverTimestamp() FieldValue, so the converter is only used for reads
  return addDoc(collection(db, COLLECTIONS.HEISTS), data)
}
