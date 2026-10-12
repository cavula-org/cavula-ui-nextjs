"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

import { CopyHash } from "@/components/CopyHash"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiUrl, isApiErrorResponse, JSON_HEADERS } from "@/lib/api"
import type {
  AuditAction,
  AuditLog,
  AuditLogListData,
} from "@/types/audit"
import type { VariantProps } from "class-variance-authority"

/** Status pengambilan data. */
type LoadState = "loading" | "ready" | "error"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

/** Label dan warna kontras per jenis aksi (aturan Radical Transparency). */
const ACTION_META: Record<
  AuditAction,
  { label: string; variant: BadgeVariant }
> = {
  CREATE: { label: "CREATE", variant: "success" },
  UPDATE: { label: "UPDATE", variant: "warning" },
  SOFT_DELETE: { label: "SOFT_DELETE", variant: "destructive" },
  TAMPER_ATTEMPT: { label: "TAMPER_ATTEMPT", variant: "destructive" },
}

function ActionBadge({ action }: { action: AuditAction }) {
  const meta = ACTION_META[action] ?? { label: action, variant: "secondary" }

  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

/** Format timestamp ISO ke waktu lokal Indonesia yang lengkap namun ringkas. */
function formatDateTime(value: string | null): string {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchLogs = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(apiUrl("/audit-logs"), {
        method: "GET",
        headers: JSON_HEADERS,
      })

      const payload: unknown = await response.json()

      if (!response.ok || isApiErrorResponse(payload)) {
        const message = isApiErrorResponse(payload)
          ? payload.message
          : "Gagal memuat log audit."

        setLoadState("error")
        setErrorMessage(message)

        return
      }

      const { logs: fetchedLogs, pagination } = (
        payload as { data: AuditLogListData }
      ).data

      setLogs(Array.isArray(fetchedLogs) ? fetchedLogs : [])
      setTotal(pagination?.total ?? 0)
      setLoadState("ready")
    } catch {
      setLoadState("error")
      setErrorMessage(
        "Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi."
      )
    }
  }, [])

  /** Pembungkus aksi manual: tampilkan loading lebih dulu. */
  const refreshLogs = useCallback((): void => {
    setLoadState("loading")
    setErrorMessage(null)
    void fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLogs()
  }, [fetchLogs])

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <header className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/15">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Transparansi Radikal
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Log Audit Publik
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Setiap perubahan data kebijakan tercatat permanen dalam rantai hash
          kriptografis. Siapa pun dapat memantau integritasnya dan menyalin
          kode hash untuk verifikasi mandiri.
        </p>
      </header>

      {loadState === "ready" && logs.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Menampilkan {logs.length} dari {total} entri terbaru.
        </p>
      )}

      {loadState === "loading" && (
        <div
          className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Memuat log audit...
        </div>
      )}

      {loadState === "error" && (
        <div className="mt-8">
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Gagal memuat</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={refreshLogs}>
              <RefreshCw aria-hidden="true" />
              Coba lagi
            </Button>
          </div>
        </div>
      )}

      {loadState === "ready" && logs.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-2 py-16 text-center">
          <ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">Belum ada entri log audit</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Catatan akan muncul di sini begitu ada aktivitas mutasi data
            kebijakan.
          </p>
        </div>
      )}

      {loadState === "ready" && logs.length > 0 && (
        <>
          {/* Desktop: tabel scannable. */}
          <div className="mt-6 hidden overflow-hidden rounded-xl ring-1 ring-foreground/10 md:block">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Daftar log audit integritas data
              </caption>
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th scope="col" className="px-4 py-3 font-medium">
                    Aksi
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Objek
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Rantai Hash
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Waktu
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b align-top last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {log.table_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{log.record_id ?? "—"}
                      </div>
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <dl className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <dt className="text-xs font-medium text-muted-foreground">
                            Payload
                          </dt>
                          <dd>
                            <CopyHash
                              value={log.payload_hash}
                              label="payload hash"
                            />
                          </dd>
                        </div>
                        <div className="flex flex-col gap-1">
                          <dt className="text-xs font-medium text-muted-foreground">
                            Sebelumnya
                          </dt>
                          <dd>
                            <CopyHash
                              value={log.previous_hash}
                              label="previous hash"
                            />
                          </dd>
                        </div>
                      </dl>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: timeline vertikal berbasis kartu. */}
          <ol className="mt-6 flex flex-col gap-3 md:hidden">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-xl bg-card p-4 ring-1 ring-inset ring-foreground/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <ActionBadge action={log.action} />
                  <time className="text-xs text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </time>
                </div>

                <div className="mt-3 text-sm">
                  <span className="font-medium text-foreground">
                    {log.table_name}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    #{log.record_id ?? "—"}
                  </span>
                </div>

                <dl className="mt-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium text-muted-foreground">
                      Payload hash
                    </dt>
                    <dd>
                      <CopyHash value={log.payload_hash} label="payload hash" />
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs font-medium text-muted-foreground">
                      Previous hash
                    </dt>
                    <dd>
                      <CopyHash
                        value={log.previous_hash}
                        label="previous hash"
                      />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex justify-center">
            <Button variant="outline" size="sm" onClick={refreshLogs}>
              <RefreshCw aria-hidden="true" />
              Muat ulang
            </Button>
          </div>
        </>
      )}
    </main>
  )
}
