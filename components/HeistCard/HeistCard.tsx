import Link from "next/link"
import { Calendar, Clock, User } from "lucide-react"
import { formatDeadline, formatTimeLeft } from "@/lib/time"
import type { Heist } from "@/types/firestore"
import styles from "./HeistCard.module.css"

type HeistCardProps = {
  heist: Heist
}

export default function HeistCard({ heist }: HeistCardProps) {
  return (
    <article className="heist-card">
      <div className={styles.titleRow}>
        <h3 className={styles.title}>
          <Link href={`/heists/${heist.id}`} className={styles.link}>
            {heist.title}
          </Link>
        </h3>
        <Clock size={16} className={styles.clock} aria-hidden="true" />
      </div>
      <div className={styles.meta}>
        <p className={styles.metaItem}>
          <User size={12} aria-hidden="true" />
          To:
          <span className={styles.assignee}>
            @{heist.assignedToCodename || "unknown"}
          </span>
        </p>
        <p className={styles.metaItem}>
          <User size={12} aria-hidden="true" />
          By:
          <span className={styles.creator}>
            @{heist.createdByCodename || "unknown"}
          </span>
        </p>
        <p className={styles.metaItem}>
          <Calendar size={12} aria-hidden="true" />
          {formatDeadline(heist.deadline)} •
          <span className={styles.timeLeft}>
            {formatTimeLeft(heist.deadline)}
          </span>
        </p>
      </div>
    </article>
  )
}
