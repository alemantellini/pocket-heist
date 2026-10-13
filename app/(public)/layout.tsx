import Footer from "@/components/Footer"
import RouteGuard from "@/components/RouteGuard"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <main className="public">
        <RouteGuard require="guest">{children}</RouteGuard>
      </main>
      <Footer />
    </>
  )
}
