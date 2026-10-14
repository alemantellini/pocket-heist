"use client"

import { Calendar, Clock, FileText, User, Users } from "lucide-react"
import Avatar from "@/components/Avatar"
import useHeist from "@/hooks/useHeist"
import {
  formatDeadline,
  formatFullDeadline,
  formatTimeRemaining,
} from "@/lib/time"
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

  const assignee = heist.assignedToCodename || "unknown"
  const creator = heist.createdByCodename || "unknown"

  return (
    <article className={styles.details}>
      <header className={styles.header}>
        <h2 className={styles.title}>{heist.title}</h2>
        <p className={styles.timeLeft}>
          <Clock size={16} aria-hidden="true" />
          {formatTimeRemaining(heist.deadline)}
        </p>
      </header>
      <div className={styles.people}>
        <section className={styles.card}>
          <h3 className={styles.label}>
            <User size={14} aria-hidden="true" />
            Assigned to
          </h3>
          <div className={styles.person}>
            <Avatar name={assignee} />
            <span className={styles.codename}>{assignee}</span>
          </div>
        </section>
        <section className={styles.card}>
          <h3 className={styles.label}>
            <Users size={14} aria-hidden="true" />
            Created by
          </h3>
          <div className={styles.person}>
            <Avatar name={creator} />
            <span className={styles.codename}>{creator}</span>
          </div>
        </section>
      </div>
      <section className={styles.card}>
        <h3 className={styles.missionTitle}>
          <FileText size={18} aria-hidden="true" />
          Mission Details
        </h3>
        <p className={styles.description}>{heist.description}</p>
      </section>
      <footer className={styles.dates}>
        {heist.createdAt && (
          <p className={styles.date}>
            <Calendar size={14} aria-hidden="true" />
            Created:
            <span className={styles.dateValue}>
              {formatDeadline(heist.createdAt)}
            </span>
          </p>
        )}
        <p className={styles.date}>
          <Clock size={14} aria-hidden="true" />
          Deadline:
          <span className={styles.dateValue}>
            {formatFullDeadline(heist.deadline)}
          </span>
        </p>
      </footer>
    </article>
  )
}
