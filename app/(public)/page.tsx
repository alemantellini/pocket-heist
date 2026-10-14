// splash page. The redirect for logged in users (--> /heists) is handled by
// the RouteGuard in the (public) layout; logged out users stay here and can
// follow the links to /login and /signup

import Link from "next/link"
import { Clock8 } from "lucide-react"
import styles from "./page.module.css"

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.wordmark}>
          P<Clock8 className="logo" strokeWidth={2.75} />
          cket Heist
        </div>
        <Link href="/login" className={styles.topLink}>
          Log in
        </Link>
      </header>

      <section className={styles.hero}>
        <div>
          <h1 className={styles.headline}>
            <span className={styles.line}>Pilfer the pens.</span>
            <span className={styles.line}>Plot the pranks.</span>
            <span className={styles.line}>Plead the fifth.</span>
          </h1>
          <p className={styles.lede}>
            Pocket Heist turns office boredom into tiny, low-stakes capers.
            Hand a heist to a coworker, set the mission, and see who pulls it
            off before time runs out.
          </p>
          <div className={styles.actions}>
            <Link href="/signup" className={styles.cta}>
              Register
            </Link>
            <p className={styles.loginPrompt}>
              Already have an account? <Link href="/login">Log in</Link>
            </p>
          </div>
        </div>

        <figure className={styles.ticket} aria-label="An example heist">
          <h2 className={styles.ticketTitle}>
            Swap the office plant for a convincing fake
          </h2>
          <p className={styles.ticketBrief}>
            Nobody mentions it. Whoever waters it first loses.
          </p>

          <div className={styles.tear} />

          <div className={styles.timeLeft}>
            <div>
              <div className={styles.label}>Time left</div>
              <div className={styles.countdown}>47:12:09</div>
            </div>
            <span className={styles.status}>In progress</span>
          </div>

          <dl className={styles.people}>
            <div>
              <dt className={styles.label}>Assigned to</dt>
              <dd className={styles.person}>QuietVelvetBadger</dd>
            </div>
            <div>
              <dt className={styles.label}>Set by</dt>
              <dd className={styles.person}>SwiftBrassFox</dd>
            </div>
          </dl>
        </figure>
      </section>

      <ol className={styles.steps}>
        <li className={styles.step}>
          <h2 className={styles.stepTitle}>Assign a heist</h2>
          <p className={styles.stepText}>
            Write a small, harmless mission and hand it to a coworker.
          </p>
        </li>
        <li className={styles.step}>
          <h2 className={styles.stepTitle}>Beat the clock</h2>
          <p className={styles.stepText}>
            They have 48 hours to pull it off without getting caught.
          </p>
        </li>
        <li className={styles.step}>
          <h2 className={styles.stepTitle}>Settle the score</h2>
          <p className={styles.stepText}>
            Mark it a success or a failure. Bragging rights follow.
          </p>
        </li>
      </ol>
    </div>
  )
}
