import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk | Cavula",
  description: "Autentikasi pengguna internal portal transparansi Cavula.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
