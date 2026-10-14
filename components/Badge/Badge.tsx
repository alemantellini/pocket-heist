import type { ReactNode } from "react"
import styles from "./Badge.module.css"

type BadgeProps = {
  children: ReactNode
  variant?: "default" | "success" | "error"
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  const className = [styles.badge, styles[variant]].join(" ")

  return <span className={className}>{children}</span>
}
