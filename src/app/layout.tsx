import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LMS JTM — Sistem Pengurusan Pembelajaran | Jabatan Tenaga Manusia",
  description:
    "Platform pembelajaran digital bersepadu untuk 33 kampus ADTEC di bawah Jabatan Tenaga Manusia (JTM) Malaysia. Latihan TVET yang berkualiti, konsisten dan boleh disahkan.",
  keywords: [
    "LMS", "JTM", "Jabatan Tenaga Manusia", "ADTEC", "TVET",
    "Pembelajaran Digital", "Sijil Digital", "SKM", "NOSS", "Malaysia",
  ],
  authors: [{ name: "Jabatan Tenaga Manusia (JTM) Malaysia" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "LMS JTM — Sistem Pengurusan Pembelajaran",
    description: "Platform pembelajaran digital bersepadu untuk 33 kampus ADTEC, JTM Malaysia.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
