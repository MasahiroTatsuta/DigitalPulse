"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Patient = { id: number; name: string };
type EcgRecord = { 
  id: number; 
  patient?: Patient; 
  isAnomaly: boolean; 
  doctorComment: string | null;
  waveformData: string;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<EcgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState(searchParams.get("searchId") || "");
  const [targetPatientId, setTargetPatientId] = useState("");
  const [onlyAnomaly, setOnlyAnomaly] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";
      let url = searchId 
        ? `${baseUrl}/api/ecg/search?patientId=${searchId}${onlyAnomaly ? "&isAnomaly=true" : ""}`
        : `${baseUrl}/api/ecg/all`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlId = searchParams.get("searchId");
    if (urlId) setSearchId(urlId);
    fetchRecords();
  }, [searchParams, onlyAnomaly]);

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

  const stats = {
    total: records.length,
    anomalies: records.filter(r => r.isAnomaly).length,
    pending: records.filter(r => !r.doctorComment || r.doctorComment.trim() === "").length
  };

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-full">
      {/* ヘッダー */}
      <header className="mb-6 lg:mb-10">
        <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter">Analytics Overview</h1>
        <p className="text-slate-500 font-bold mt-1 text-[10px] lg:text-sm uppercase tracking-widest">Medical Analysis System</p>
      </header>

      {/* 統計カード (スマホでは縦に並べる) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-10">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className={`bg-white p-5 rounded-3xl border shadow-sm ${stats.anomalies > 0 ? 'border-red-100 ring-4 ring-red-50' : 'border-slate-100'}`}>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Anomalies</p>
          <p className={`text-3xl font-black ${stats.anomalies > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.anomalies}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-black text-slate-900">{stats.pending}</p>
        </div>
      </div>

      {/* アクションパネル */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 検索カード */}
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
                <button onClick={fetchRecords} className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">検索</button>
              </div>
            </div>
            <div className="flex items-center gap-3 cursor-pointer select-none py-1" onClick={() => setOnlyAnomaly(!onlyAnomaly)}>
              <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${onlyAnomaly ? "bg-red-500" : "bg-slate-200"}`}>
                <div className={`bg-white w-3 h-3 rounded-full shadow transition-transform ${onlyAnomaly ? "translate-x-5" : ""}`} />
              </div>
              <span className="font-bold text-slate-700 text-xs">異常のみ表示</span>
            </div>
          </div>
        </div>

        {/* インポートカード */}
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

      {/* 🌟 修正の要: データテーブルコンテナ (w-full と overflow-x-auto が鍵) */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full">
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
              <AnimatePresence>
                {records.map((r) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={r.id} className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors">
                    <td className="p-5 font-bold text-slate-400">#{r.id}</td>
                    <td className="p-5 font-black text-xs">{r.patient ? `PT-${r.patient.id.toString().padStart(4, '0')}` : "GUEST"}</td>
                    <td className="p-5">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black ${r.isAnomaly ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                        {r.isAnomaly ? "ANOMALY" : "NORMAL"}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="max-w-[200px]">
                        <p className="text-[11px] text-slate-600 line-clamp-1 italic font-medium">
                          {r.doctorComment || "---"}
                        </p>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <Link href={`/records/${r.id}`}>
                        <button className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all">VIEW</button>
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
    </main>
  );
}