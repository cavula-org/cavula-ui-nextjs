/**
 * Kontrak tipe log audit publik Cavula (modul Radical Transparency).
 *
 * Mengikuti backend `cavula-api-laravel`:
 * - Tabel: migration create_audit_logs_master_table.
 * - Model: App\Models\AuditLog (append-only, hanya created_at).
 * - Endpoint: App\Http\Controllers\Api\V1\AuditLogController@index.
 *
 * Catatan privasi: backend sengaja TIDAK mengekspos ip_address dan
 * user_agent (lihat AuditLogService::PUBLIC_COLUMNS), jadi keduanya tidak
 * ada di tipe ini.
 */

import type { ApiSuccessResponse } from "@/types/auth";

/**
 * Jenis aksi mutasi yang tercatat.
 *
 * Sinkron dengan enum kolom `action` di audit_logs_master.
 * TAMPER_ATTEMPT dicatat bila sistem mendeteksi upaya pengubahan data.
 */
export type AuditAction = "CREATE" | "UPDATE" | "SOFT_DELETE" | "TAMPER_ATTEMPT";

/**
 * Satu entri log audit sebagaimana dipublikasikan ke warga.
 *
 * Properti inti diminta spesifikasi (id, action, table_name, record_id,
 * payload_hash, previous_hash, created_at). Nilai old/new disertakan opsional
 * karena backend ikut mengirimkannya dan berguna untuk inspeksi detail.
 */
export interface AuditLog {
  id: number;
  /** Aktor mutasi; null untuk aksi sistem/anonim. */
  user_id: number | null;
  action: AuditAction;
  table_name: string;
  /** ID baris yang dimutasi; null bila tidak terikat satu record. */
  record_id: number | null;
  /** Hash SHA-256 payload (selalu ada, 64 karakter heksadesimal). */
  payload_hash: string;
  /** Hash entri sebelumnya dalam rantai; null untuk entri pertama. */
  previous_hash: string | null;
  created_at: string | null;
  /** Snapshot nilai lama (JSON) untuk aksi UPDATE. */
  old_values?: Record<string, unknown> | null;
  /** Snapshot nilai baru (JSON). */
  new_values?: Record<string, unknown> | null;
}

/** Metadata paginasi standar dari AuditLogController. */
export interface Pagination {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
}

/** Data respons sukses GET /audit-logs. */
export interface AuditLogListData {
  logs: AuditLog[];
  pagination: Pagination;
}

export type AuditLogListResponse = ApiSuccessResponse<AuditLogListData>;
