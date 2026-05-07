"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// 型定義：バックエンドのDTO/JSON構造に完全に一致させています
type EcgRecord = { 
  id: number; 
  patientId: number | null;
  patientName: string;
  anomaly: boolean; // 🌟 以前の isAnomaly から anomaly に修正
  doctorComment: string | null;
  recordedAt: string;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<EcgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState(searchParams.get("searchId") || "");
  const [onlyAnomaly, setOnlyAnomaly] = useState(false);
  
  // 🌟 ページネーション用ステート
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const [targetPatientId, setTargetPatientId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";
      
      // 🌟 クエリパラメータに page と size を含める
      let url = searchId 
        ? `${baseUrl}/api/ecg/search?patientId=${searchId}&page=${page}&size=${pageSize}${onlyAnomaly ? "&isAnomaly=true" : ""}`
        : `${baseUrl}/api/ecg/all?page=${page}&size=${pageSize}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Fetch failed");
      
      const data = await res.json();
      
      // 🌟 Spring Boot の Page オブジェクトからデータを抽出
      setRecords(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // ページ番号やフィルタ設定が変わるたびに再フェッチ
  useEffect(() => {
    fetchRecords();
  }, [page, onlyAnomaly, searchId]);

  // 検索時は1ページ目に戻す
  const handleSearch = () => {
    setPage(0);
    fetchRecords();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (targetPatientId) formData.append("patientId", targetPatientId);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";
      const res = await fetch(`${baseUrl}/api/ecg/import`, { 
        method: "POST", 
        body: formData, 
        credentials: "include" 
      });
      if (res.ok) {
        alert("インポートが完了しました");
        setPage(0); // 最新のデータを見るために1ページ目に戻す
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      setTargetPatientId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-full bg-gray-50 min-h-screen font-sans">
      <header className="mb-6 lg:mb-10">
        <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter">Analytics Overview</h1>
        <p className="text-slate-500 font-bold mt-1 text-[10px] lg:text-sm uppercase tracking-widest">Medical Analysis System</p>
      </header>

      {/* 統計カードセクション */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-hover hover:shadow-md">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
          <p className="text-3xl font-black text-slate-900">{totalElements}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-hover hover:shadow-md">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Page</p>
          <p className="text-3xl font-black text-blue-600">
            {page + 1} <span className="text-sm text-slate-300 font-bold">/ {totalPages || 1}</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-hover hover:shadow-md">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine Status</p>
          <p className="text-3xl font-black text-slate-900 flex items-center gap-2">
            {loading ? "..." : "Online"}
            <span className={`w-3 h-3 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}></span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 検索・フィルタパネル */}
        <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex flex-col gap-6">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Patient Database Search</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="flex-1 border-2 border-slate-50 bg-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all w-full"
                  placeholder="Enter Patient ID (e.g. 502)"
                />
                <button onClick={handleSearch} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-blue-600">Search</button>
              </div>
            </div>
            <div className="flex items-center gap-4 cursor-pointer select-none group" onClick={() => { setPage(0); setOnlyAnomaly(!onlyAnomaly); }}>
              <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${onlyAnomaly ? "bg-red-500 shadow-red-200 shadow-lg" : "bg-slate-200"}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${onlyAnomaly ? "translate-x-6" : ""}`} />
              </div>
              <span className={`font-black text-[10px] uppercase tracking-widest transition-colors ${onlyAnomaly ? "text-red-500" : "text-slate-400"}`}>Show Anomalies Only</span>
            </div>
          </div>
        </div>

        {/* インポートパネル */}
        <div className="bg-white p-6 lg:p-8 rounded-[2rem] shadow-sm border border-dashed border-blue-200 flex flex-col justify-center">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-3">Rapid Import</label>
          <input 
            type="number"
            placeholder="Link Patient ID (Optional)"
            value={targetPatientId}
            onChange={(e) => setTargetPatientId(e.target.value)}
            className="w-full border-2 border-slate-50 bg-slate-50 rounded-xl px-4 py-3 text-xs mb-4 focus:bg-white outline-none font-bold"
          />
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-2 border-blue-600'}`}
          >
            {isUploading ? "Processing..." : "Select ECG CSV"}
          </button>
        </div>
      </div>

      {/* データテーブル */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden w-full mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
              <tr>
                <th className="p-6">Record ID</th>
                <th className="p-6">Patient Subject</th>
                <th className="p-6">Diagnostic Status</th>
                <th className="p-6">AI Clinical Summary</th>
                <th className="p-6 text-center">Operation</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <AnimatePresence mode="wait">
                {records.map((r) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    key={r.id} 
                    className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="p-6 font-bold text-slate-300 font-mono text-xs">#{r.id.toString().padStart(4, '0')}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-slate-800 tracking-tight">{r.patientName || "GUEST"}</span>
                        <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">PT-{r.patientId ? r.patientId.toString().padStart(4, '0') : "----"}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black shadow-sm ${
                        r.anomaly ? "bg-red-50 text-red-600 ring-1 ring-red-100" : "bg-green-50 text-green-600 ring-1 ring-green-100"
                      }`}>
                        {r.anomaly ? "ANOMALY DETECTED" : "NORMAL RHYTHM"}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="max-w-[320px]">
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic font-medium leading-relaxed">
                          {r.doctorComment || "No diagnostic notes available."}
                        </p>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <Link href={`/records/${r.id}`}>
                        <button className="bg-slate-100 text-slate-900 group-hover:bg-blue-600 group-hover:text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm">
                          View Report
                        </button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {records.length === 0 && !loading && (
          <div className="py-32 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No clinical data matched your criteria</p>
          </div>
        )}
      </div>

      {/* 🌟 ページネーションコントロール */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mt-4 no-print pb-24">
        <div className="flex items-center gap-3">
          <button 
            disabled={page === 0 || loading}
            onClick={() => setPage(prev => prev - 1)}
            className="flex items-center justify-center w-14 h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-20 disabled:hover:border-slate-100 disabled:hover:text-slate-600 transition-all shadow-sm active:scale-90"
          >
            <span className="text-xl font-bold">←</span>
          </button>
          
          <div className="flex items-center px-8 h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Page <span className="text-blue-600 text-base mx-1 font-mono">{page + 1}</span> / {totalPages || 1}
            </span>
          </div>

          <button 
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage(prev => prev + 1)}
            className="flex items-center justify-center w-14 h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-20 disabled:hover:border-slate-100 disabled:hover:text-slate-600 transition-all shadow-sm active:scale-90"
          >
            <span className="text-xl font-bold">→</span>
          </button>
        </div>
        
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Displaying {records.length} of {totalElements} total records
        </p>
      </div>
    </main>
  );
}