import type { Metadata } from "next"
import type { ReactNode } from "react"

/**
 * Metadata area dasbor.
 *
 * Diletakkan di layout karena halaman dasbor adalah Client Component
 * (butuh token, fetch sisi klien, dan state modal) sehingga tidak bisa
 * mengekspor `metadata` sendiri.
 */
export const metadata: Metadata = {
  title: "Dasbor | Cavula",
  robots: { index: false, follow: false },
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
