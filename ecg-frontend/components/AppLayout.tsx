"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // ログイン不要でアクセスできるページ（ログイン画面など）
  const publicPaths = ["/", "/login", "/api/auth/signin"];

  useEffect(() => {
    const isPublicPath = publicPaths.includes(pathname);

    // 【重要】未ログイン 且つ 公開ページ以外にアクセスしようとしたらトップへ戻す
    if (status === "unauthenticated" && !isPublicPath) {
      router.replace("/");
    }
  }, [status, pathname, router]);

  // 1. 読み込み中はローディングを表示
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // 2. 🌟 ログイン済みの場合は、どのページでもサイドバーを表示する
  if (status === "authenticated") {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen bg-slate-50">
          {children}
        </main>
      </div>
    );
  }

  // 3. 未ログインの場合は、サイドバーなしの全画面表示
  // （ランディングページやログインフォームがここを通ります）
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}