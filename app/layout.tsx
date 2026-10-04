import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/context";
import { UserProvider } from "@/lib/context/UserContext";
import { AuthProvider } from "@/lib/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Agro-Trust 360 — National Dashboard",
  description: "National digital infrastructure for Bangladesh's agricultural supply chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${inter.variable} ${notoBengali.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AuthProvider>
          <UserProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
