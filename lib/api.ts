import type { ApiErrorResponse } from "@/types/auth";

/**
 * Base URL API Laravel, mis. http://localhost:8000/api/v1
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/** Header wajib untuk setiap request ke backend Cavula. */
export const JSON_HEADERS: Readonly<Record<string, string>> = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

/**
 * Bangun URL endpoint absolut.
 *
 * @throws Error bila NEXT_PUBLIC_API_URL belum dikonfigurasi, supaya
 *   kegagalan konfigurasi terlihat jelas alih-alih memanggil "undefined/...".
 */
export function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL belum dikonfigurasi. Tambahkan ke .env.local."
    );
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;

  return `${base}${suffix}`;
}

/** Type guard untuk envelope error standar Cavula. */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return candidate.success === false && typeof candidate.message === "string";
}

/**
 * Ambil pesan error pertama untuk sebuah field dari respons 422 Laravel.
 */
export function firstFieldError(
  errors: Record<string, string[]> | undefined,
  field: string
): string | undefined {
  return errors?.[field]?.[0];
}
