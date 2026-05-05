"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // 🌟 ログインしていなくても通行を許可する「ホワイトリスト」
  // ログインフォーム(/api/auth/signin)やトップページを含めます
  const publicPaths = ["/", "/login", "/api/auth/signin"];

  useEffect(() => {
    const isPublicPath = publicPaths.includes(pathname);

    // 🌟 セキュリティガードの修正：
    // 未ログイン かつ 「ホワイトリストに含まれないページ」にアクセスした時だけ追い返す
    if (status === "unauthenticated" && !isPublicPath) {
      router.replace("/");
    }
  }, [status, pathname, router]);

  // 1. セッション確認中はローディング画面を表示
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // 2. 以下の場合は「サイドバーなし」の全画面レイアウトで表示
  // ・未ログインである
  // ・または、トップページ（ランディングページ）を表示している
  const isPublicPath = publicPaths.includes(pathname);
  if (status === "unauthenticated" || pathname === "/") {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  // 3. ログイン済み、かつ管理画面系（Dashboard, Patientsなど）の場合はサイドバーあり
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-slate-50">
        {children}
      </main>
    </div>
  );
}