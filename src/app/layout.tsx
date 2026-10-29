import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contacts — Gestion de contacts",
  description: "Votre espace de gestion de contacts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
