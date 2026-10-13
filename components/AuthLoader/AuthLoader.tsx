import { Clock8 } from "lucide-react"
import styles from "./AuthLoader.module.css"

export default function AuthLoader() {
  return (
    <div className={styles.loader} role="status">
      <Clock8
        className={styles.spinner}
        size={40}
        strokeWidth={2.75}
        aria-hidden="true"
      />
      <span className={styles.label}>Loading…</span>
    </div>
  )
}
