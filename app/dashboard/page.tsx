"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CircleAlert,
  CircleCheck,
  FileText,
  LoaderCircle,
  RefreshCw,
} from "lucide-react"

import { CreatePolicyModal } from "@/components/CreatePolicyModal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiUrl, isApiErrorResponse, JSON_HEADERS } from "@/lib/api"
import { clearSession, getStoredToken } from "@/lib/auth"
import { cn } from "@/lib/utils"
import type { PolicyDraft, PolicyStatus } from "@/types/policy"

/** Status pengambilan data daftar draf. */
type LoadState = "loading" | "ready" | "error"

/** Label dan warna kontras per status (sesuai Aturan Transparansi di ai.md). */
const STATUS_META: Record<PolicyStatus, { label: string; className: string }> = {
  draft: {
    label: "Draf",
    className: "bg-muted text-muted-foreground ring-foreground/10",
  },
  peer_review: {
    label: "Tinjauan Pakar",
    className:
      "bg-amber-500/15 text-amber-700 ring-amber-600/30 dark:text-amber-400",
  },
  public_consultation: {
    label: "Konsultasi Publik",
    className:
      "bg-blue-500/15 text-blue-700 ring-blue-600/30 dark:text-blue-400",
  },
  enacted: {
    label: "Disahkan",
    className:
      "bg-emerald-500/15 text-emerald-700 ring-emerald-600/30 dark:text-emerald-400",
  },
}

function StatusBadge({ status }: { status: PolicyStatus }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground ring-foreground/10",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.className
      )}
    >
      {meta.label}
    </span>
  )
}

/** Format tanggal ISO ke format lokal Indonesia yang ringkas. */
function formatDate(value: string | null): string {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date)
}

/**
 * Normalisasi `data` respons menjadi larik PolicyDraft tanpa memakai `any`.
 *
 * Endpoint daftar backend belum final, jadi kita menerima beberapa bentuk
 * yang masuk akal: larik langsung, atau objek berisi `policies`/`drafts`/
 * `logs` (pola yang dipakai controller lain di Cavula).
 */
function extractDrafts(data: unknown): PolicyDraft[] {
  if (Array.isArray(data)) {
    return data as PolicyDraft[]
  }

  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>

    for (const key of ["policies", "drafts", "logs", "items"]) {
      if (Array.isArray(record[key])) {
        return record[key] as PolicyDraft[]
      }
    }
  }

  return []
}

export default function DashboardPage() {
  const [drafts, setDrafts] = useState<PolicyDraft[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchDrafts = useCallback(async (): Promise<void> => {
    const token = getStoredToken()

    if (token === null || token === "") {
      setLoadState("error")
      setErrorMessage("Sesi Anda telah berakhir. Silakan masuk kembali.")

      return
    }

    try {
      const response = await fetch(apiUrl("/policies"), {
        method: "GET",
        headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
      })

      // Token ditolak backend: bersihkan sesi agar Proxy mengalihkan ke login.
      if (response.status === 401) {
        clearSession()
        setLoadState("error")
        setErrorMessage("Sesi Anda telah berakhir. Silakan masuk kembali.")

        return
      }

      const payload: unknown = await response.json()

      if (!response.ok || isApiErrorResponse(payload)) {
        const message = isApiErrorResponse(payload)
          ? payload.message
          : "Gagal memuat daftar draf kebijakan."

        setLoadState("error")
        setErrorMessage(message)

        return
      }

      const data = (payload as { data?: unknown }).data
      setDrafts(extractDrafts(data))
      setLoadState("ready")
    } catch {
      setLoadState("error")
      setErrorMessage(
        "Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi."
      )
    }
  }, [])

  /** Pembungkus untuk aksi manual: tampilkan state loading lebih dulu. */
  const refreshDrafts = useCallback((): void => {
    setLoadState("loading")
    setErrorMessage(null)
    void fetchDrafts()
  }, [fetchDrafts])

  useEffect(() => {
    // Pengambilan data awal saat mount. State hanya di-set setelah await
    // (bukan sinkron saat render), sehingga tidak memicu render ganda.
    // Aturan ini tidak membedakan fetch-on-mount dari anti-pattern derivasi
    // state, jadi dinonaktifkan khusus pada baris ini.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDrafts()
  }, [fetchDrafts])

  function handleCreated(): void {
    setSuccessMessage("Draf kebijakan berhasil dibuat.")
    refreshDrafts()

    // Pesan sukses bersifat sementara agar tidak menumpuk di layar.
    window.setTimeout(() => setSuccessMessage(null), 6000)
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Dasbor Internal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola draf kebijakan dan pantau statusnya secara transparan.
          </p>
        </div>

        <CreatePolicyModal onCreated={handleCreated} />
      </header>

      {successMessage !== null && (
        <Alert className="mt-6 border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
          <CircleCheck aria-hidden="true" />
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription className="text-emerald-800/90 dark:text-emerald-300/90">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle>Daftar Draf Kebijakan</CardTitle>
          <CardDescription>
            Seluruh draf yang Anda miliki akses, beserta status terkininya.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loadState === "loading" && (
            <div
              className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Memuat draf kebijakan...
            </div>
          )}

          {loadState === "error" && (
            <div className="py-8">
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertTitle>Gagal memuat</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={refreshDrafts}>
                  <RefreshCw aria-hidden="true" />
                  Coba lagi
                </Button>
              </div>
            </div>
          )}

          {loadState === "ready" && drafts.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <FileText
                className="size-8 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">Belum ada draf kebijakan</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Mulai dengan menekan tombol &ldquo;Buat Draf Kebijakan
                Baru&rdquo; untuk membuat draf pertama Anda.
              </p>
            </div>
          )}

          {loadState === "ready" && drafts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">Daftar draf kebijakan</caption>
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th scope="col" className="py-2.5 pr-4 font-medium">
                      Judul
                    </th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">
                      Status
                    </th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">
                      Dokumen Akademik
                    </th>
                    <th scope="col" className="py-2.5 font-medium">
                      Dibuat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr
                      key={draft.id}
                      className="border-b last:border-0 align-top"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-medium text-foreground">
                          {draft.title}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={draft.status} />
                      </td>
                      <td className="py-3 pr-4">
                        {draft.academic_doc_url ? (
                          <a
                            href={draft.academic_doc_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            Lihat dokumen
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(draft.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
