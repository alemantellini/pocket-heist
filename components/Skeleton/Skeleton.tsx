import styles from "./Skeleton.module.css"

export default function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true" data-testid="skeleton">
      <div className={styles.header}>
        <div className={styles.avatar} />
        <div className={styles.titleLines}>
          <div className={styles.titleLine} />
          <div className={styles.subtitleLine} />
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.line} />
        <div className={styles.line} />
        <div className={styles.shortLine} />
      </div>
    </div>
  )
}
