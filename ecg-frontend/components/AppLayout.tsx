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

  if (status === "authenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
        {/* スマホ用ヘッダー (画面上部に固定) */}
        <header className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-40 w-full shadow-md">
          <span className="font-black text-sm tracking-tighter">DigitalPulse <span className="text-blue-500">AI</span></span>
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 active:scale-95 transition-all"
          >
            <span className="text-xl">☰</span>
          </button>
        </header>

        {/* サイドバー本体 */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* メインコンテンツエリア: w-full と overflow-hidden で「はみ出し」を徹底防御 */}
        <main className="flex-1 w-full max-w-full overflow-x-hidden lg:ml-64 min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return <div className="min-h-screen bg-slate-50">{children}</div>;
}