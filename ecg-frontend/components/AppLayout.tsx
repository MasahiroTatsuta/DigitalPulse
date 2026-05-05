"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 🌟 セキュリティガード: 未ログインで、トップページ以外にアクセスしたら強制送還
    if (status === "unauthenticated" && pathname !== "/") {
      router.replace("/");
    }
  }, [status, pathname, router]);

  // 1. セッション確認中はローディング画面
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // 2. 未ログイン状態: サイドバーなし。コンテンツ（LandingPage）を全画面表示
  if (status === "unauthenticated") {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  // 3. ログイン状態: サイドバーありのダッシュボードレイアウト
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-slate-50">
        {children}
      </main>
    </div>
  );
}