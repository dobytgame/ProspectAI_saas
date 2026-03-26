'use client'

import Link from "next/link";
import { Zap } from "lucide-react";
import { login } from "@/app/(auth)/actions";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-mesh bg-noise relative"
      style={{ background: "var(--background)" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)" }}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl p-8 z-10"
        style={{
          background: "var(--background-2)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: "scale-in 0.4s ease",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link href="/" className="transition-transform hover:scale-105">
            <img src="/capturo.png" alt="Capturo Logo" className="h-12 w-auto object-contain" />
          </Link>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
              Entre na sua conta
            </p>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-4" action={login}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
              E-mail
            </label>
            <input
              name="email" type="email" placeholder="nome@empresa.com" required
              className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "var(--background-3)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                e.target.style.borderColor = "var(--primary)";
                e.target.style.boxShadow = "0 0 0 3px var(--primary-dim)";
              }}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--foreground-muted)" }}>
                Senha
              </label>
              <Link href="#" className="text-xs transition-colors" style={{ color: "var(--primary)" }}>
                Esqueceu?
              </Link>
            </div>
            <input
              name="password" type="password" required
              className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "var(--background-3)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                e.target.style.borderColor = "var(--primary)";
                e.target.style.boxShadow = "0 0 0 3px var(--primary-dim)";
              }}
              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 mt-2"
            style={{
              background: "linear-gradient(135deg, var(--primary), #0066FF)",
              color: "var(--primary-fg)",
              boxShadow: "0 4px 20px var(--primary-glow)",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Entrar
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="px-3 text-xs" style={{ color: "var(--foreground-dim)" }}>ou continue com</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Google */}
        <button
          type="button"
          className="w-full h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2.5 transition-all duration-200"
          style={{
            background: "var(--background-3)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google
        </button>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--foreground-dim)" }}>
          Não tem conta?{" "}
          <Link href="/signup" className="font-semibold transition-colors" style={{ color: "var(--primary)" }}>
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
