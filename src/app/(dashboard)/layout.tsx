import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Painel",
  description: "Dashboard Capturo — campanhas, leads e pipeline.",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
