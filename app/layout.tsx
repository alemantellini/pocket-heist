import type { Metadata } from "next"
import "@/app/globals.css"
import AuthProvider from "@/components/AuthProvider"

export const metadata: Metadata = {
  title: "Pocket Heist",
  description: "Steal small. Laugh big.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}