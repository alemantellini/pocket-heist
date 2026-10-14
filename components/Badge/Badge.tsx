import styles from "./Badge.module.css"

type BadgeProps = {
  children: React.ReactNode
  variant?: "default" | "success" | "error"
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>
}
