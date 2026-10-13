import styles from "./Footer.module.css"

export default function Footer() {
  return (
    <footer className={styles.siteFooter}>
      <p>Steal small. Laugh big.</p>
      <p>&copy; {new Date().getFullYear()} Pocket Heist</p>
    </footer>
  )
}
