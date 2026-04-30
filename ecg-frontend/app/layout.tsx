import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// NextAuthProviderをインポート（パスが異なる場合は適宜調整してください）
import NextAuthProvider from "@/components/NextAuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// メタデータを医療アプリらしく更新
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
      <body className="min-h-full flex flex-col">
        {/* NextAuthProviderで全体を包み込むことで、認証状態をアプリ全体で共有します */}
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}