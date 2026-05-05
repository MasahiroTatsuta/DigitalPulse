"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: "📊" },
    { name: "Patients", href: "/patients", icon: "👥" },
  ];

  return (
    <>
      {/* スマホ用オーバーレイ（メニューが開いている時に背景を暗くする） */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`
        w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 p-6 flex flex-col z-50 transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 no-print
      `}>
        <div className="mb-10 px-2 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">
              DigitalPulse <span className="text-blue-500">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Medical Portal v2</p>
          </div>
          {/* スマホ用閉じるボタン */}
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if(window.innerWidth < 1024) onClose(); }} // クリックしたら閉じる
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                pathname === item.href 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}