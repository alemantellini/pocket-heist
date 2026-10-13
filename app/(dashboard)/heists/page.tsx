import HeistList from "@/components/HeistList"

export default function HeistsPage() {
  return (
    <div className="page-content">
      <div className="active-heists">
        <h2>Your Active Heists</h2>
        <HeistList type="active" />
      </div>
      <div className="assigned-heists">
        <h2>Heists You&apos;ve Assigned</h2>
        <HeistList type="assigned" />
      </div>
      <div className="expired-heists">
        <h2>All Expired Heists</h2>
        <HeistList type="expired" />
      </div>
    </div>
  )
}
