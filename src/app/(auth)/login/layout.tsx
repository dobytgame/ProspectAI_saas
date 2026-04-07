import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta Capturo.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
