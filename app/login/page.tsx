"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiUrl, firstFieldError, isApiErrorResponse, JSON_HEADERS } from "@/lib/api";
import { DEFAULT_AUTHENTICATED_ROUTE, persistSession } from "@/lib/auth";
import type { LoginResponse } from "@/types/auth";

/** Error per field, hasil validasi lokal maupun respons 422 Laravel. */
interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * Tentukan tujuan setelah login: kembalikan pengguna ke rute yang tadinya
 * mereka coba akses (dikirim Proxy via ?next=), dengan proteksi agar hanya
 * path internal yang diterima (mencegah open redirect).
 */
function resolveRedirectTarget(): string {
  if (typeof window === "undefined") {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  const next = new URLSearchParams(window.location.search).get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  return next;
}

export default function LoginPage() {
  const router = useRouter();
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /** Validasi lokal ringan sebelum menembak API. */
  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (email.trim() === "") {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Format email tidak valid.";
    }

    if (password === "") {
      errors.password = "Password wajib diisi.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setFormError(null);

    const localErrors = validate();
    setFieldErrors(localErrors);

    if (Object.keys(localErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const payload: unknown = await response.json();

      if (!response.ok || isApiErrorResponse(payload)) {
        if (!isApiErrorResponse(payload)) {
          setFormError("Terjadi kesalahan pada server. Silakan coba lagi.");

          return;
        }

        // 422: petakan error validasi Laravel ke input yang bersangkutan.
        const emailError = firstFieldError(payload.errors, "email");
        const passwordError = firstFieldError(payload.errors, "password");

        setFieldErrors({ email: emailError, password: passwordError });

        // 401 (kredensial salah / akun nonaktif) tidak terikat ke satu field,
        // jadi pesan backend ditampilkan sebagai peringatan global.
        if (emailError === undefined && passwordError === undefined) {
          setFormError(payload.message);
        }

        return;
      }

      const { data } = payload as LoginResponse;

      persistSession({ token: data.token, user: data.user });

      router.replace(resolveRedirectTarget());
    } catch {
      setFormError(
        "Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Masuk ke Cavula</CardTitle>
          <CardDescription>
            Gunakan akun resmi Anda untuk mengakses dasbor internal.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent>
            {formError !== null && (
              <Alert variant="destructive" className="mb-5">
                <CircleAlert aria-hidden="true" />
                <AlertTitle>Login gagal</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field data-invalid={fieldErrors.email !== undefined}>
                <FieldLabel htmlFor={emailId}>Email</FieldLabel>
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nama@instansi.go.id"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.email !== undefined}
                  aria-describedby={
                    fieldErrors.email !== undefined ? `${emailId}-error` : undefined
                  }
                />
                <FieldError id={`${emailId}-error`}>{fieldErrors.email}</FieldError>
              </Field>

              <Field data-invalid={fieldErrors.password !== undefined}>
                <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
                <Input
                  id={passwordId}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.password !== undefined}
                  aria-describedby={
                    fieldErrors.password !== undefined
                      ? `${passwordId}-error`
                      : undefined
                  }
                />
                <FieldError id={`${passwordId}-error`}>
                  {fieldErrors.password}
                </FieldError>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
