"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

interface CopyHashProps {
  /** Nilai hash lengkap yang akan disalin. */
  value: string | null
  /** Label aksesibilitas, mis. "payload hash" atau "previous hash". */
  label: string
  className?: string
}

/**
 * Menampilkan untaian hash kriptografi dengan font monospace plus tombol
 * "Copy Hash" agar warga mudah menyalinnya untuk verifikasi integritas.
 *
 * Hash ditampilkan utuh tetapi diizinkan membungkus (break-all) sehingga
 * tetap terbaca di layar ponsel tanpa memaksa scroll horizontal.
 */
export function CopyHash({ value, label, className }: CopyHashProps) {
  const [copied, setCopied] = useState<boolean>(false)

  // Entri pertama rantai tidak punya previous_hash.
  if (value === null || value === "") {
    return (
      <span className="font-mono text-xs text-muted-foreground italic">
        — (genesis)
      </span>
    )
  }

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value as string)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard bisa ditolak (konteks non-secure); gagal diam-diam
      // agar tidak mengganggu, tombol tetap bisa dicoba lagi.
    }
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted/60 px-1.5 py-1 ring-1 ring-inset ring-foreground/10",
        className
      )}
    >
      <code className="font-mono text-xs leading-tight break-all text-foreground/80">
        {value}
      </code>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copied ? `${label} tersalin` : `Salin ${label}`}
        title={copied ? "Tersalin" : "Salin hash"}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
        <span className="sr-only">
          {copied ? "Tersalin" : "Salin hash"}
        </span>
      </button>
    </span>
  )
}
