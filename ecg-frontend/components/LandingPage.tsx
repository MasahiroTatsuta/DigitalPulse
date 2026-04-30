"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      {/* --- Hero Section --- */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        {/* 背景の心電図ラインアニメーション */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none" className="absolute top-1/2 -translate-y-1/2">
            <motion.path
              d="M0,100 L200,100 L220,20 L250,180 L270,100 L1000,100"
              fill="transparent"
              stroke="#2563eb"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>

        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="mb-4 inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-widest uppercase"
          >
            Next Gen ECG Platform
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900"
          >
            Digital<span className="text-blue-600">Pulse</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-8 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
          >
            AIが不整脈を検知し、医療現場の迅速な判断をサポート。<br />
            安全で直感的な心電図解析プラットフォームへ、ようこそ。
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/login" className="px-12 py-4 bg-gray-900 hover:bg-black text-white rounded-full font-bold text-lg shadow-xl transition-all">
              Sign In to System
            </Link>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-10 text-gray-300 font-bold tracking-widest text-xs uppercase"
        >
          Scroll Down
        </motion.div>
      </section>

      {/* --- Feature Section --- */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
          {[
            { 
              num: "01", 
              title: "AI Analysis", 
              desc: "MIT-BIHデータに基づいた解析により、SVEBやVEBなどの不整脈を自動で分類。診断の補助として機能します。" 
            },
            { 
              num: "02", 
              title: "Smart Filtering", 
              desc: "膨大なデータの中から、特定の患者IDや異常波形のみを瞬時にフィルタリング。必要な情報へ1クリックでアクセス。" 
            },
            { 
              num: "03", 
              title: "Visual Reports", 
              desc: "解析結果をプロフェッショナルなPDFレポートとして出力。臨床現場での情報共有を円滑にします。" 
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
              className="relative group"
            >
              <div className="text-7xl font-black text-gray-50 mb-[-40px] select-none group-hover:text-blue-50 transition-colors">
                {item.num}
              </div>
              <h3 className="relative z-10 text-2xl font-bold mb-4 text-gray-800">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-20 bg-white border-t border-gray-100 text-center">
        <p className="text-gray-400 text-xs font-medium tracking-widest uppercase">
          © 2026 DigitalPulse Medical System. Created for Academic Purposes.
        </p>
      </footer>
    </div>
  );
}