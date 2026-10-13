import { useEffect, useState } from "react"
import {
  Timestamp,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import type { FirestoreDataConverter, FirestoreError } from "firebase/firestore"
import { useUser } from "@/components/AuthProvider"
import { db } from "@/lib/firebase"
import { COLLECTIONS, heistConverter } from "@/types/firestore"
import type { Heist } from "@/types/firestore"

// active:   heists assigned to the current user whose deadline hasn't passed
// assigned: every heist the current user created
// expired:  anyone's heists past their deadline with a final status set
export type HeistQueryType = "active" | "assigned" | "expired"

// results are stored with the key they were fetched for, so loading can be
// derived when the type or user changes instead of resetting state in the effect
type Result = {
  key: string
  heists: Heist[]
  error: FirestoreError | null
}

const NO_HEISTS: Heist[] = []

function buildQuery(type: HeistQueryType, uid: string) {
  // heistConverter's toFirestore is typed looser than Firestore expects, and
  // only fromFirestore matters for reads
  const heists = collection(db, COLLECTIONS.HEISTS).withConverter(
    heistConverter as FirestoreDataConverter<Heist>,
  )
  // taken once per subscription, so heists don't move between lists live
  const now = Timestamp.now()

  switch (type) {
    case "active":
      return query(
        heists,
        where("assignedTo", "==", uid),
        where("deadline", ">", now),
        orderBy("deadline", "asc"),
      )
    case "assigned":
      return query(
        heists,
        where("createdBy", "==", uid),
        orderBy("createdAt", "desc"),
      )
    case "expired":
      // two inequality filters, so both fields are ordered explicitly to
      // match the composite index in firestore.indexes.json
      return query(
        heists,
        where("deadline", "<", now),
        where("finalStatus", "!=", null),
        orderBy("deadline", "desc"),
        orderBy("finalStatus", "asc"),
      )
  }
}

export default function useHeists(type: HeistQueryType) {
  const { user } = useUser()
  const uid = user?.uid
  const [result, setResult] = useState<Result | null>(null)
  const key = uid ? `${type}:${uid}` : null

  useEffect(() => {
    if (!uid || !key) return

    return onSnapshot(
      buildQuery(type, uid),
      (snapshot) => {
        setResult({
          key,
          heists: snapshot.docs.map((doc) => doc.data()),
          error: null,
        })
      },
      (error) => {
        console.error("useHeists: listener failed", error)
        setResult({ key, heists: NO_HEISTS, error })
      },
    )
  }, [type, uid, key])

  const current = result && result.key === key ? result : null

  return {
    heists: current?.heists ?? NO_HEISTS,
    loading: !current,
    error: current?.error ?? null,
  }
}
