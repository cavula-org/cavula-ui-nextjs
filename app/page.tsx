import { redirect } from "next/navigation"

/**
 * Beranda mengarahkan langsung ke halaman login.
 *
 * Cavula adalah aplikasi internal terproteksi; tidak ada landing publik di
 * root. Satu-satunya pintu masuk adalah /login, sehingga `/` cukup
 * mengalihkan ke sana (sumber kebenaran tunggal untuk UI login).
 */
export default function Home() {
  redirect("/login")
}
