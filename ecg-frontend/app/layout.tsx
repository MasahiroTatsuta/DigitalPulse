import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// NextAuthProviderをインポート
import NextAuthProvider from "@/components/NextAuthProvider";
import AppLayout from "@/components/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// メタデータの設定
export const metadata: Metadata = {
  title: "DigitalPulse | 統合心電図解析システム",
  description: "医療従事者のためのセキュアな心電図データ管理プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* 1. 認証状態をアプリ全体で共有 */}
        <NextAuthProvider>          
          <AppLayout>
            {children}
          </AppLayout>
        </NextAuthProvider>
      </body>
    </html>
  );
}