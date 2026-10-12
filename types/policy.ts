/**
 * Kontrak tipe draf kebijakan Cavula.
 *
 * Bentuk tipe di sini mengikuti backend `cavula-api-laravel`:
 * - Kolom tabel: migration create_policy_drafts_table.
 * - Validasi input: App\Http\Requests\Policy\StorePolicyDraftRequest.
 * - Respons store: App\Http\Controllers\Api\V1\PolicyController@store.
 */

import type { ApiSuccessResponse } from "@/types/auth";

/**
 * Status siklus hidup draf kebijakan.
 *
 * Sinkron dengan enum kolom `status` di tabel policy_drafts:
 * draft -> peer_review -> public_consultation -> enacted.
 */
export type PolicyStatus =
  | "draft"
  | "peer_review"
  | "public_consultation"
  | "enacted";

/**
 * Satu entri draf kebijakan sebagaimana ditampilkan di dasbor internal.
 *
 * Properti inti diminta spesifikasi (id, title, content, academic_doc_url,
 * status, created_at). Properti audit opsional disertakan agar siap pakai
 * bila backend mengirimkannya, tanpa memaksa UI bergantung padanya.
 */
export interface PolicyDraft {
  id: number;
  title: string;
  content: string;
  /** URL dokumen akademik. Nullable di DB, wajib saat pembuatan via form. */
  academic_doc_url: string | null;
  status: PolicyStatus;
  created_at: string | null;
  /** Skor hasil peer review (decimal:2 → dikirim sebagai string oleh Laravel). */
  score_review?: string | null;
  updated_at?: string | null;
}

/** Payload form pembuatan draf (POST /policies). */
export interface CreatePolicyPayload {
  title: string;
  content: string;
  academic_doc_url: string;
}

/**
 * Data respons sukses POST /policies.
 *
 * Backend saat ini hanya mengembalikan ringkasan (bukan draf utuh); lihat
 * PolicyController@store yang mengirim policy_id, status, dan audit_hash.
 */
export interface CreatePolicyResponseData {
  policy_id: number;
  status: PolicyStatus;
  /** Hash kriptografi entri audit, null bila observer belum menuliskannya. */
  audit_hash: string | null;
}

export type CreatePolicyResponse = ApiSuccessResponse<CreatePolicyResponseData>;

/** Respons sukses daftar draf (GET /policies). */
export type PolicyListResponse = ApiSuccessResponse<PolicyDraft[]>;
