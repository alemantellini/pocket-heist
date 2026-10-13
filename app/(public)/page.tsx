// splash page. The redirect for logged in users (--> /heists) is handled by
// the RouteGuard in the (public) layout; logged out users stay here and can
// follow the links to /login and /signup

import { Clock8 } from "lucide-react";

export default function Home() {
  return (
    <div className="center-content">
      <div className="page-content">
        <h1>
          P<Clock8 className="logo" strokeWidth={2.75} />
          cket Heist
        </h1>
        <div>Small steals. Big laughs. Zero HR involvement.</div>
        <p>
          Pocket Heist turns everyday office boredom into tiny, low-stakes
          capers. Assign a heist to a coworker, set the mission, and see who
          pulls it off before time runs out.
        </p>
      </div>
    </div>
  );
}
