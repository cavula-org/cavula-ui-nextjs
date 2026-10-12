/**
 * Kontrak tipe autentikasi Cavula.
 *
 * Bentuk tipe di sini mengikuti respons nyata dari `cavula-api-laravel`
 * (lihat App\Http\Controllers\Api\V1\AuthController), bukan asumsi.
 */

/** Peran RBAC yang di-seed backend (lihat RoleSeeder). */
export type RoleName = "admin" | "asn_maker" | "pakar_reviewer" | "warga";

export interface Role {
  id: number;
  name: RoleName;
  description: string | null;
}

/**
 * Pengguna terautentikasi.
 *
 * Catatan: backend saat ini mengembalikan model User mentah, sehingga yang
 * terkirim adalah `role_id`. Properti `role` hanya terisi bila backend
 * melakukan eager-load relasi peran.
 */
export interface User {
  id: number;
  role_id: number | null;
  name: string;
  email: string;
  status: number;
  email_verified_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  /** MySQL tinyint: 0 = aktif, 1 = terhapus. Bukan boolean. */
  is_deleted: number;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  role?: Role | null;
}

/** Payload sukses endpoint POST /auth/login. */
export interface LoginResponseData {
  user: User;
  token: string;
  token_type: string;
}

/** Envelope respons sukses standar Cavula. */
export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
}

/** Envelope respons gagal standar Cavula (termasuk 422 dan 401). */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type LoginResponse = ApiSuccessResponse<LoginResponseData>;

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

/** Kredensial yang dikirim dari form login. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Sesi yang dipersistensi di sisi klien. */
export interface AuthSession {
  token: string;
  user: User;
}
