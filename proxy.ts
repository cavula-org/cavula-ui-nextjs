import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

/**
 * Proteksi rute klien untuk area dasbor.
 *
 * Sejak Next.js 16, Middleware bernama Proxy dan konvensinya adalah file
 * `proxy.ts` di root project (fungsionalitasnya sama).
 *
 * Pemeriksaan di sini bersifat optimistic: hanya memastikan token ada, tanpa
 * memvalidasinya ke backend. Sesuai anjuran Next.js, otorisasi sebenarnya
 * tetap wajib dilakukan saat pengambilan data (Laravel akan menolak token
 * kedaluwarsa dengan 401).
 */
export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  if (token === undefined || token === "") {
    const loginUrl = new URL("/login", request.url);

    // Simpan tujuan awal agar pengguna dikembalikan ke sana setelah login.
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Dua pola: `/dashboard` untuk root area, `/dashboard/:path*` untuk turunannya.
  matcher: ["/dashboard", "/dashboard/:path*"],
};
