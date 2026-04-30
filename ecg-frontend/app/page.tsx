"use client";

import { useSession } from "next-auth/react";
import LandingPage from "@/components/LandingPage";
import DashboardPage from "@/components/DashboardPage";

export default function Home() {
  const { data: session, status } = useSession();

  // 1. セッションの確認中（ローディング）
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // 2. ログイン済みならダッシュボード、未ログインならLPを表示
  return session ? <DashboardPage /> : <LandingPage />;
}