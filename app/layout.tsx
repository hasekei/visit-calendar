import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "面会管理カレンダー",
  description: "入院患者の面会スケジュールを共有・管理するカレンダーアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable}`}>
      <body className="font-[var(--font-noto-sans-jp)] antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
