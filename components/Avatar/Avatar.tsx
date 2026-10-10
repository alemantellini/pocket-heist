import styles from "./Avatar.module.css"

type AvatarProps = {
  name: string
}

const PASCAL_CASE = /^[A-Z][a-z0-9]*([A-Z][a-z0-9]*)+$/

export function getInitials(name: string) {
  const trimmed = name.trim()

  if (PASCAL_CASE.test(trimmed)) {
    return (trimmed.match(/[A-Z]/g) ?? []).slice(0, 2).join("")
  }

  return trimmed.charAt(0).toUpperCase()
}

export default function Avatar({ name }: AvatarProps) {
  return (
    <div className={styles.avatar} role="img" aria-label={name}>
      {getInitials(name)}
    </div>
  )
}
