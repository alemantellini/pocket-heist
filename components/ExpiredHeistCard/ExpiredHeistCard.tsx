import Link from "next/link"
import { Calendar, CircleCheck, CircleDashed, CircleX, User } from "lucide-react"
import { formatDeadline } from "@/lib/time"
import type { Heist } from "@/types/firestore"
import styles from "./ExpiredHeistCard.module.css"

type ExpiredHeistCardProps = {
  heist: Heist
}

// a heist can be expired without a final status, as nothing sets one yet
const STATUSES = {
  success: {
    label: "success",
    Icon: CircleCheck,
    iconClass: styles.iconSuccess,
    badgeClass: styles.badgeSuccess,
  },
  failure: {
    label: "failed",
    Icon: CircleX,
    iconClass: styles.iconFailure,
    badgeClass: styles.badgeFailure,
  },
  unresolved: {
    label: "unresolved",
    Icon: CircleDashed,
    iconClass: styles.iconUnresolved,
    badgeClass: styles.badgeUnresolved,
  },
} as const

type PersonProps = {
  label: string
  srLabel: string
  codename: string
  codenameClass: string
}

// the visible "To:" / "By:" is hidden from screen readers in favour of a
// clearer label
function Person({ label, srLabel, codename, codenameClass }: PersonProps) {
  return (
    <p className={styles.person}>
      <User size={12} aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
      <span className={styles.srOnly}>{srLabel}</span>
      <span className={codenameClass}>@{codename || "unknown"}</span>
    </p>
  )
}

export default function ExpiredHeistCard({ heist }: ExpiredHeistCardProps) {
  const status = heist.finalStatus ?? "unresolved"
  const { label, Icon, iconClass, badgeClass } = STATUSES[status]

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <Icon size={16} className={iconClass} aria-hidden="true" />
        <h3 className={styles.title}>
          <Link href={`/heists/${heist.id}`} className={styles.link}>
            {heist.title}
          </Link>
        </h3>
        <p className={styles.date}>
          <Calendar size={12} aria-hidden="true" />
          {formatDeadline(heist.deadline)}
        </p>
        <span className={badgeClass}>
          <span className={styles.srOnly}>Status: </span>
          {label}
        </span>
      </div>
      <div className={styles.people}>
        <Person
          label="To:"
          srLabel="Assigned to"
          codename={heist.assignedToCodename}
          codenameClass={styles.assignee}
        />
        <Person
          label="By:"
          srLabel="Created by"
          codename={heist.createdByCodename}
          codenameClass={styles.creator}
        />
      </div>
    </article>
  )
}
