import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import type { FirestoreDataConverter, FirestoreError } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { COLLECTIONS, heistConverter } from "@/types/firestore"
import type { Heist } from "@/types/firestore"

// results are stored with the id they were fetched for, so loading can be
// derived when the id changes instead of resetting state in the effect
type Result = {
  id: string
  heist: Heist | null
  error: FirestoreError | null
}

// heist is null while loading, and also once loaded if the heist doesn't exist
export default function useHeist(id: string) {
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    // heistConverter's toFirestore is typed looser than Firestore expects, and
    // only fromFirestore matters for reads
    const ref = doc(db, COLLECTIONS.HEISTS, id).withConverter(
      heistConverter as FirestoreDataConverter<Heist>,
    )

    return onSnapshot(
      ref,
      (snapshot) => {
        setResult({
          id,
          heist: snapshot.exists() ? snapshot.data() : null,
          error: null,
        })
      },
      (error) => {
        console.error("useHeist: listener failed", error)
        setResult({ id, heist: null, error })
      },
    )
  }, [id])

  const current = result && result.id === id ? result : null

  return {
    heist: current?.heist ?? null,
    loading: !current,
    error: current?.error ?? null,
  }
}
