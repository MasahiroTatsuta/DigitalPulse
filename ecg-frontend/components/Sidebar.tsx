"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: "📊" },
    { name: "Patients", href: "/patients", icon: "👥" },
  ];

  return (
    <aside className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 p-6 flex flex-col no-print">
      <div className="mb-10 px-2">
        <h1 className="text-xl font-black text-white tracking-tighter">
          DigitalPulse <span className="text-blue-500">AI</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Medical Portal v2</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
              pathname === item.href 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
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
  );
}