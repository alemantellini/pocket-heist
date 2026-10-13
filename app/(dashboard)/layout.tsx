// components
import Navbar from "@/components/Navbar"
import RouteGuard from "@/components/RouteGuard"

export default function HeistsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <RouteGuard require="user">
      <Navbar />
      <main>{children}</main>
    </RouteGuard>
  )
}
