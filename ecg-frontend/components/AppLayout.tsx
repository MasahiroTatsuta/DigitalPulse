"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const publicPaths = ["/", "/login", "/api/auth/signin"];

  useEffect(() => {
    const isPublicPath = publicPaths.includes(pathname);
    if (status === "unauthenticated" && !isPublicPath) {
      router.replace("/");
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // ログイン済みの場合のレイアウト
  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* スマホ用トップバー（ここにあるハンバーガーメニューでサイドバーを開く） */}
        <header className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30">
          <span className="font-black text-sm tracking-tighter">DigitalPulse <span className="text-blue-500">AI</span></span>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-800 rounded-lg">
            ☰
          </button>
        </header>

        <div className="flex">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          
          {/* メインコンテンツ: PCでは左マージンあり、スマホではなし */}
          <main className="flex-1 lg:ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // 未ログイン時のレイアウト
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}