import type { AuthSession, User } from "@/types/auth";

/**
 * Nama cookie penyimpan token Sanctum.
 *
 * Cookie dipilih (bukan localStorage) karena Proxy/Middleware berjalan di
 * server dan hanya bisa membaca cookie. localStorage tidak terlihat di sana.
 */
export const AUTH_TOKEN_COOKIE = "cavula_token";

/** Kunci localStorage untuk data profil pengguna (kebutuhan tampilan). */
export const AUTH_USER_STORAGE_KEY = "cavula_user";

/** Umur sesi klien: 8 jam kerja. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/** Rute tujuan default setelah login berhasil. */
export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

/**
 * Simpan sesi hasil login.
 *
 * Token masuk ke cookie agar bisa dibaca Proxy, profil pengguna disimpan di
 * localStorage supaya cookie tetap ringan.
 */
export function persistSession({ token, user }: AuthSession): void {
  if (typeof document === "undefined") {
    return;
  }

  const attributes = [
    `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    "path=/",
    `max-age=${SESSION_MAX_AGE_SECONDS}`,
    "samesite=lax",
  ];

  // Secure hanya relevan di HTTPS; localhost dev memakai http.
  if (window.location.protocol === "https:") {
    attributes.push("secure");
  }

  document.cookie = attributes.join("; ");
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

/** Hapus sesi klien (logout atau token ditolak backend). */
export function clearSession(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

/** Ambil token dari cookie di sisi klien. */
export function getStoredToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${AUTH_TOKEN_COOKIE}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(AUTH_TOKEN_COOKIE.length + 1));
}

/**
 * Ambil profil pengguna tersimpan dengan validasi bentuk data.
 *
 * Mengembalikan null bila data rusak, sehingga tidak ada `any` yang lolos
 * ke lapisan UI.
 */
export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Type guard minimal untuk objek User. */
function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string"
  );
}
