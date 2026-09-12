import "./globals.css";
import { establishment } from "@/config/establishment";

export const metadata = {
  title: establishment.name,
  description: establishment.slogan,
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
