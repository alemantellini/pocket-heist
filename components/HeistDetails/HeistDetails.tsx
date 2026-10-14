"use client"

import { Calendar, Clock, User } from "lucide-react"
import useHeist from "@/hooks/useHeist"
import { formatDeadline, formatTimeLeft } from "@/lib/time"
import styles from "./HeistDetails.module.css"

type HeistDetailsProps = {
  id: string
}

export default function HeistDetails({ id }: HeistDetailsProps) {
  const { heist, loading, error } = useHeist(id)

  if (error) {
    return (
      <p role="alert" className={styles.error}>
        We couldn&apos;t load this heist, please try again later
      </p>
    )
  }

  if (loading) {
    return (
      <div className={styles.loading} role="status" aria-busy="true">
        <span className={styles.srOnly}>Loading heist…</span>
        <div className={styles.titleSkeleton} aria-hidden="true" />
        <div className={styles.bodySkeleton} aria-hidden="true" />
      </div>
    )
  }

  if (!heist) {
    return <p className={styles.message}>Heist not found</p>
  }

  return (
    <article className={styles.details}>
      <h2 className={styles.title}>{heist.title}</h2>
      <dl className={styles.meta}>
        <div className={styles.metaItem}>
          <dt>
            <User size={14} aria-hidden="true" />
            Assigned to
          </dt>
          <dd className={styles.assignee}>
            @{heist.assignedToCodename || "unknown"}
          </dd>
        </div>
        <div className={styles.metaItem}>
          <dt>
            <User size={14} aria-hidden="true" />
            Created by
          </dt>
          <dd className={styles.creator}>
            @{heist.createdByCodename || "unknown"}
          </dd>
        </div>
        <div className={styles.metaItem}>
          <dt>
            <Calendar size={14} aria-hidden="true" />
            Deadline
          </dt>
          <dd>{formatDeadline(heist.deadline)}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt>
            <Clock size={14} aria-hidden="true" />
            Time left
          </dt>
          <dd className={styles.timeLeft}>{formatTimeLeft(heist.deadline)}</dd>
        </div>
      </dl>
      <section className={styles.description}>
        <h3>Details</h3>
        <p>{heist.description}</p>
      </section>
    </article>
  )
}
