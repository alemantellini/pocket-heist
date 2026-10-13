"use client"

import ExpiredHeistCard from "@/components/ExpiredHeistCard"
import HeistCard from "@/components/HeistCard"
import HeistCardSkeleton from "@/components/HeistCardSkeleton"
import useHeists from "@/hooks/useHeists"
import type { HeistQueryType } from "@/hooks/useHeists"
import styles from "./HeistList.module.css"

const EMPTY_MESSAGES: Record<HeistQueryType, string> = {
  active: "No active heists",
  assigned: "No heists assigned yet",
  expired: "No expired heists",
}

const SKELETON_COUNT = 3

type HeistListProps = {
  type: HeistQueryType
}

export default function HeistList({ type }: HeistListProps) {
  const { heists, loading, error } = useHeists(type)
  const showCards = type !== "expired"

  if (error) {
    return (
      <p role="alert" className={styles.error}>
        We couldn&apos;t load these heists, please try again later
      </p>
    )
  }

  if (loading) {
    if (!showCards) {
      return <p className={styles.message}>Loading heists…</p>
    }

    return (
      <div className={styles.grid} role="status" aria-busy="true">
        <span className={styles.srOnly}>Loading heists…</span>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <HeistCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (heists.length === 0) {
    return <p className={styles.message}>{EMPTY_MESSAGES[type]}</p>
  }

  if (showCards) {
    return (
      <ul className={styles.grid}>
        {heists.map((heist) => (
          <li key={heist.id}>
            <HeistCard heist={heist} />
          </li>
        ))}
      </ul>
    )
  }

  // only the expired type gets here, active and assigned returned above
  return (
    <ul className={styles.stack}>
      {heists.map((heist) => (
        <li key={heist.id}>
          <ExpiredHeistCard heist={heist} />
        </li>
      ))}
    </ul>
  )
}
