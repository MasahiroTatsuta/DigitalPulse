"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Patient = { id: number; name: string };
type EcgRecord = { 
  id: number; 
  patientId: number | null;
  patientName: string;
  isAnomaly: boolean; 
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
      
      // 🌟 page と size を含めたURL構築
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
      
      // 🌟 Pageオブジェクトからのデータ抽出
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

  // 🌟 ページ番号やフィルタが変わるたびにデータを再取得
  useEffect(() => {
    fetchRecords();
  }, [page, onlyAnomaly, searchId]);

  // 検索実行時は1ページ目に戻す
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
        setPage(0); // 最新を見るために1ページ目へ
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
    <main className="p-4 sm:p-6 lg:p-10 max-w-full bg-gray-50 min-h-screen">
      <header className="mb-6 lg:mb-10">
        <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter">Analytics Overview</h1>
        <p className="text-slate-500 font-bold mt-1 text-[10px] lg:text-sm uppercase tracking-widest">Medical Analysis System</p>
      </header>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-10">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
          <p className="text-3xl font-black text-slate-900">{totalElements}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Page</p>
          <p className="text-3xl font-black text-blue-600">{page + 1} <span className="text-sm text-slate-300">/ {totalPages}</span></p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <p className="text-3xl font-black text-slate-900">{loading ? "Loading..." : "Online"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Search Patient ID</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="flex-1 border-2 border-slate-50 bg-slate-50 rounded-xl px-4 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all w-full"
                  placeholder="ID: 25"
                />
                <button onClick={handleSearch} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">検索</button>
              </div>
            </div>
            <div className="flex items-center gap-3 cursor-pointer select-none py-1" onClick={() => { setPage(0); setOnlyAnomaly(!onlyAnomaly); }}>
              <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${onlyAnomaly ? "bg-red-500" : "bg-slate-200"}`}>
                <div className={`bg-white w-3 h-3 rounded-full shadow transition-transform ${onlyAnomaly ? "translate-x-5" : ""}`} />
              </div>
              <span className="font-bold text-slate-700 text-xs">異常のみ表示</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-dashed border-blue-200">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Bulk Import</label>
          <input 
            type="number"
            placeholder="患者IDを紐付け (任意)"
            value={targetPatientId}
            onChange={(e) => setTargetPatientId(e.target.value)}
            className="w-full border-2 border-slate-50 bg-slate-50 rounded-xl px-3 py-2 text-xs mb-3 focus:bg-white outline-none"
          />
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full py-3 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white ring-2 ring-blue-600'}`}
          >
            {isUploading ? "Uploading..." : "CSVファイルを選択"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full mb-6">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-widest">
              <tr>
                <th className="p-5">ID</th>
                <th className="p-5">Patient</th>
                <th className="p-5">Status</th>
                <th className="p-5">AI Summary</th>
                <th className="p-5 text-center">Action</th>
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
                    className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="p-5 font-bold text-slate-400">#{r.id}</td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="font-black text-xs text-slate-800">{r.patientName || "GUEST"}</span>
                        <span className="text-[9px] font-mono text-slate-400">ID: {r.patientId || "---"}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black ${r.isAnomaly ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                        {r.isAnomaly ? "ANOMALY" : "NORMAL"}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="max-w-[300px]">
                        <p className="text-[11px] text-slate-600 line-clamp-1 italic font-medium">
                          {r.doctorComment || "---"}
                        </p>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <Link href={`/records/${r.id}`}>
                        <button className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95">VIEW</button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {records.length === 0 && !loading && (
          <div className="p-20 text-center text-slate-400 font-bold text-sm">該当データがありません</div>
        )}
      </div>

      {/* 🌟 ページめくりボタンセクション */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-4 no-print pb-20">
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 0 || loading}
            onClick={() => setPage(prev => prev - 1)}
            className="flex items-center justify-center w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-20 disabled:hover:border-slate-100 disabled:hover:text-slate-600 transition-all shadow-sm"
          >
            <span className="font-black">←</span>
          </button>
          
          <div className="flex items-center px-6 h-12 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Page <span className="text-blue-600 text-sm mx-1">{page + 1}</span> / {totalPages || 1}
            </span>
          </div>

          <button 
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage(prev => prev + 1)}
            className="flex items-center justify-center w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-20 disabled:hover:border-slate-100 disabled:hover:text-slate-600 transition-all shadow-sm"
          >
            <span className="font-black">→</span>
          </button>
        </div>
        
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
          Total {totalElements} Records Found
        </p>
      </div>
    </main>
  );
}