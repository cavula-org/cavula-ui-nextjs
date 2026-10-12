"use client"

import { useId, useState, type FormEvent, type ReactElement } from "react"
import { CircleAlert, LoaderCircle, Plus } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiUrl, firstFieldError, isApiErrorResponse, JSON_HEADERS } from "@/lib/api"
import { getStoredToken } from "@/lib/auth"
import type { CreatePolicyResponse } from "@/types/policy"

/** Error per field, hasil validasi lokal maupun respons 422 Laravel. */
interface FieldErrors {
  title?: string
  content?: string
  academic_doc_url?: string
}

interface CreatePolicyModalProps {
  /**
   * Dipanggil setelah draf berhasil dibuat, agar pemanggil (dasbor) bisa
   * menyegarkan daftar. Menerima ringkasan respons backend.
   */
  onCreated?: (data: CreatePolicyResponse["data"]) => void
  /** Memungkinkan pemanggil mengganti pemicu default bila diperlukan. */
  trigger?: ReactElement
}

/**
 * Modal form pembuatan draf kebijakan baru.
 *
 * Menembak POST /policies dengan Bearer token Sanctum. State dikendalikan
 * agar modal otomatis menutup saat sukses dan form di-reset tiap kali dibuka.
 */
export function CreatePolicyModal({ onCreated, trigger }: CreatePolicyModalProps) {
  const formId = useId()
  const titleId = `${formId}-title`
  const contentId = `${formId}-content`
  const urlId = `${formId}-url`

  const [open, setOpen] = useState<boolean>(false)
  const [title, setTitle] = useState<string>("")
  const [content, setContent] = useState<string>("")
  const [academicDocUrl, setAcademicDocUrl] = useState<string>("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  function resetForm(): void {
    setTitle("")
    setContent("")
    setAcademicDocUrl("")
    setFieldErrors({})
    setFormError(null)
  }

  function handleOpenChange(nextOpen: boolean): void {
    // Jangan izinkan menutup di tengah pengiriman agar status tetap konsisten.
    if (isSubmitting && !nextOpen) {
      return
    }

    setOpen(nextOpen)

    if (nextOpen) {
      resetForm()
    }
  }

  /** Validasi lokal ringan sebelum menembak API. */
  function validate(): FieldErrors {
    const errors: FieldErrors = {}

    if (title.trim() === "") {
      errors.title = "Judul kebijakan wajib diisi."
    } else if (title.trim().length > 255) {
      errors.title = "Judul kebijakan maksimal 255 karakter."
    }

    if (content.trim() === "") {
      errors.content = "Isi kebijakan wajib diisi."
    }

    if (academicDocUrl.trim() === "") {
      errors.academic_doc_url = "URL dokumen akademik wajib diisi."
    } else if (!/^https?:\/\/.+/i.test(academicDocUrl.trim())) {
      errors.academic_doc_url = "URL dokumen akademik tidak valid."
    }

    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    setFormError(null)

    const localErrors = validate()
    setFieldErrors(localErrors)

    if (Object.keys(localErrors).length > 0) {
      return
    }

    const token = getStoredToken()

    if (token === null || token === "") {
      setFormError("Sesi Anda telah berakhir. Silakan masuk kembali.")

      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(apiUrl("/policies"), {
        method: "POST",
        headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          academic_doc_url: academicDocUrl.trim(),
        }),
      })

      const payload: unknown = await response.json()

      if (!response.ok || isApiErrorResponse(payload)) {
        if (!isApiErrorResponse(payload)) {
          setFormError("Terjadi kesalahan pada server. Silakan coba lagi.")

          return
        }

        // 422: petakan error validasi Laravel ke input yang bersangkutan.
        const titleError = firstFieldError(payload.errors, "title")
        const contentError = firstFieldError(payload.errors, "content")
        const urlError = firstFieldError(payload.errors, "academic_doc_url")

        setFieldErrors({
          title: titleError,
          content: contentError,
          academic_doc_url: urlError,
        })

        // Error non-field (mis. 401/403) ditampilkan sebagai peringatan global.
        if (
          titleError === undefined &&
          contentError === undefined &&
          urlError === undefined
        ) {
          setFormError(payload.message)
        }

        return
      }

      const { data } = payload as CreatePolicyResponse

      onCreated?.(data)
      setOpen(false)
      resetForm()
    } catch {
      setFormError(
        "Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus aria-hidden="true" />
              Buat Draf Kebijakan Baru
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Buat Draf Kebijakan Baru</DialogTitle>
          <DialogDescription>
            Lengkapi detail draf. Setiap pembuatan tercatat otomatis dalam log
            audit kriptografis Cavula.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          {formError !== null && (
            <Alert variant="destructive" className="mb-4">
              <CircleAlert aria-hidden="true" />
              <AlertTitle>Gagal membuat draf</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field data-invalid={fieldErrors.title !== undefined}>
              <FieldLabel htmlFor={titleId}>Judul Kebijakan</FieldLabel>
              <Input
                id={titleId}
                name="title"
                type="text"
                placeholder="mis. Kebijakan Transparansi Anggaran Daerah"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={isSubmitting}
                aria-invalid={fieldErrors.title !== undefined}
                aria-describedby={
                  fieldErrors.title !== undefined ? `${titleId}-error` : undefined
                }
              />
              <FieldError id={`${titleId}-error`}>{fieldErrors.title}</FieldError>
            </Field>

            <Field data-invalid={fieldErrors.content !== undefined}>
              <FieldLabel htmlFor={contentId}>Isi Kebijakan</FieldLabel>
              <Textarea
                id={contentId}
                name="content"
                rows={6}
                placeholder="Uraikan substansi draf kebijakan secara lengkap."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                disabled={isSubmitting}
                aria-invalid={fieldErrors.content !== undefined}
                aria-describedby={
                  fieldErrors.content !== undefined
                    ? `${contentId}-error`
                    : undefined
                }
              />
              <FieldError id={`${contentId}-error`}>
                {fieldErrors.content}
              </FieldError>
            </Field>

            <Field data-invalid={fieldErrors.academic_doc_url !== undefined}>
              <FieldLabel htmlFor={urlId}>URL Dokumen Akademik</FieldLabel>
              <Input
                id={urlId}
                name="academic_doc_url"
                type="url"
                inputMode="url"
                placeholder="https://..."
                value={academicDocUrl}
                onChange={(event) => setAcademicDocUrl(event.target.value)}
                disabled={isSubmitting}
                aria-invalid={fieldErrors.academic_doc_url !== undefined}
                aria-describedby={
                  fieldErrors.academic_doc_url !== undefined
                    ? `${urlId}-error`
                    : undefined
                }
              />
              <FieldError id={`${urlId}-error`}>
                {fieldErrors.academic_doc_url}
              </FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Batal
                </Button>
              }
            />
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan Draf"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
