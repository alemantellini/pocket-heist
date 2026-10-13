import styles from "./HeistCardSkeleton.module.css"

export default function HeistCardSkeleton() {
  return (
    <div
      className={styles.card}
      aria-hidden="true"
      data-testid="heist-card-skeleton"
    >
      <div className={styles.titleLines}>
        <div className={styles.line} />
        <div className={styles.shortLine} />
      </div>
      <div className={styles.meta}>
        <div className={styles.metaLine} />
        <div className={styles.metaLine} />
        <div className={styles.metaLineShort} />
      </div>
    </div>
  )
}
