"use client"

import useHeists from "@/hooks/useHeists"
import type { HeistQueryType } from "@/hooks/useHeists"
import styles from "./HeistList.module.css"

const EMPTY_MESSAGES: Record<HeistQueryType, string> = {
  active: "No active heists",
  assigned: "No heists assigned yet",
  expired: "No expired heists",
}

type HeistListProps = {
  type: HeistQueryType
}

export default function HeistList({ type }: HeistListProps) {
  const { heists, loading, error } = useHeists(type)

  if (error) {
    return (
      <p role="alert" className={styles.error}>
        We couldn&apos;t load these heists, please try again later
      </p>
    )
  }

  if (loading) {
    return <p className={styles.message}>Loading heists…</p>
  }

  if (heists.length === 0) {
    return <p className={styles.message}>{EMPTY_MESSAGES[type]}</p>
  }

  return (
    <ul className={styles.list}>
      {heists.map((heist) => (
        <li key={heist.id}>{heist.title}</li>
      ))}
    </ul>
  )
}
