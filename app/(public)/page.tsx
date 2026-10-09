// this page should be used only as a splash page to decide where a user should be navigated to
// when logged in --> to /heists
// when not logged in --> to /login

import { Clock8 } from "lucide-react"

export default function Home() {
  return (
    <div className="center-content">
      <div className="page-content">
        <h1>
          P<Clock8 className="logo" strokeWidth={2.75} />cket Heist
        </h1>
        <div>Tiny missions. Big office mischief.</div>
        <p>
          Pocket Heist turns everyday office boredom into tiny, low-stakes
          capers. Assign a heist to a coworker, set the mission, and see who
          pulls it off before time runs out.
        </p>
      </div>
    </div>
  )
}
