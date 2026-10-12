import { Clock8, Plus } from "lucide-react"
import Link from "next/link"
import LogoutButton from "@/components/LogoutButton"
import styles from "./Navbar.module.css"

export default function Navbar() {
  return (
    <div className={styles.siteNav}>
      <nav>
        <header>
          <h1>
            <Link href="/heists">
              P<Clock8 className={styles.logo} size={14} strokeWidth={2.75} />
              cket Heist
            </Link>
          </h1>
          <div>Steal small. Laugh big.</div>
        </header>
        <ul>
          <LogoutButton />
          <li>
            <Link href="/heists/create" className={styles.createLink}>
              <Plus size={20} aria-hidden="true" />
              Create New Heist
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
