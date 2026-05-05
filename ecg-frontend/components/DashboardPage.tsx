"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; // 🌟 URLパラメータ取得のために追加
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
  const searchParams = useSearchParams(); // 🌟 URLのクエリパラメータ (?searchId=...) を取得
  
  const [records, setRecords] = useState<EcgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🌟 初期値をURLのsearchIdから取得。なければ空文字
  const [searchId, setSearchId] = useState(searchParams.get("searchId") || "");
  const [targetPatientId, setTargetPatientId] = useState("");
  const [onlyAnomaly, setOnlyAnomaly] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";
      
      // searchIdがある場合は検索API、ない場合は全件APIを叩く
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
      
      // フロントエンド側での補完フィルタリング
      const filteredData = (!searchId && onlyAnomaly) 
        ? data.filter((r: EcgRecord) => r.isAnomaly) 
        : data;
        
      setRecords(filteredData);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 URLのパラメータが変わった（または「異常のみ」が切り替わった）時に再検索
  useEffect(() => {
    const urlId = searchParams.get("searchId");
    if (urlId) {
      setSearchId(urlId);
    }
    fetchRecords();
  }, [searchParams, onlyAnomaly]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (targetPatientId) {
      formData.append("patientId", targetPatientId);
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";
      const res = await fetch(`${baseUrl}/api/ecg/import`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        alert(`${targetPatientId ? `患者ID: ${targetPatientId} として` : ""}インポート完了`);
        fetchRecords();
      } else {
        alert("アップロードに失敗しました");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      setTargetPatientId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 統計データの計算
  const stats = {
    total: records.length,
    anomalies: records.filter(r => r.isAnomaly).length,
    pending: records.filter(r => !r.doctorComment || r.doctorComment.trim() === "").length
  };

  return (
    <main className="p-6 sm:p-10">
      
      {/* ヘッダー */}
      <header className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Analytics Overview</h1>
        <p className="text-slate-500 font-bold mt-1 text-sm">システム全体の解析状況と最新の検査結果</p>
      </header>

      {/* 統計カードセクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
          <p className="text-4xl font-black text-slate-900">{stats.total}</p>
          <div className="mt-2 text-xs text-blue-600 font-bold">全患者の総データ数</div>
        </div>
        
        <div className={`bg-white p-6 rounded-3xl border shadow-sm transition-all ${stats.anomalies > 0 ? 'border-red-100 ring-4 ring-red-50' : 'border-slate-100'}`}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Anomalies Detected</p>
          <p className={`text-4xl font-black ${stats.anomalies > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.anomalies}</p>
          <div className="mt-2 text-xs text-red-500 font-bold">要確認の異常波形</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Analysis</p>
          <p className="text-4xl font-black text-slate-900">{stats.pending}</p>
          <div className="mt-2 text-xs text-amber-500 font-bold">AI解析待ち / レポート未作成</div>
        </div>
      </div>

      {/* アクションパネル (検索 + インポート) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient ID Search</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 border-2 border-slate-50 bg-slate-50 rounded-xl px-4 py-2 focus:bg-white focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: 25"
              />
              <button onClick={fetchRecords} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">検索</button>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 cursor-pointer select-none" onClick={() => setOnlyAnomaly(!onlyAnomaly)}>
            <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${onlyAnomaly ? "bg-red-500" : "bg-slate-200"}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${onlyAnomaly ? "translate-x-6" : ""}`} />
            </div>
            <span className="font-bold text-slate-700 text-sm">異常のみ表示</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-dashed border-blue-200 flex flex-col justify-center gap-3">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">Bulk Import</p>
          <input 
            type="number"
            placeholder="紐付ける患者IDを入力 (任意)"
            value={targetPatientId}
            onChange={(e) => setTargetPatientId(e.target.value)}
            className="w-full border-2 border-slate-50 bg-slate-50 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-blue-400 outline-none transition-all"
          />
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${isUploading ? 'bg-slate-200 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
          >
            {isUploading ? "Uploading..." : "CSVファイルを選択"}
          </button>
        </div>
      </div>

      {/* データテーブル */}
      <div className="bg-white rounded-3xl shadow-sm overflow-x-auto border border-slate-100">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-5 rounded-tl-3xl">ID</th>
              <th className="p-5">Patient</th>
              <th className="p-5">Status</th>
              <th className="p-5">AI Doctor's Summary</th>
              <th className="p-5 text-center rounded-tr-3xl">Action</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            <AnimatePresence>
              {records.map((r) => (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={r.id} className="border-b border-slate-50 hover:bg-blue-50/50 transition-colors">
                  <td className="p-5 font-bold text-slate-400">#{r.id}</td>
                  <td className="p-5 font-black">{r.patient ? `PT-${r.patient.id.toString().padStart(4, "0")}` : "GUEST"}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${r.isAnomaly ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {r.isAnomaly ? "ANOMALY" : "NORMAL"}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="max-w-md">
                      <p className="text-xs text-slate-600 line-clamp-2 italic font-medium">
                        {r.doctorComment || "⚠️ 解析待ち..."}
                      </p>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <Link href={`/records/${r.id}`}>
                      <button className="bg-slate-800 text-white px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-blue-600 transition-all shadow-sm">VIEW ➔</button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {records.length === 0 && !loading && (
          <div className="p-20 text-center text-slate-400 font-bold">
            該当するデータが見つかりません
          </div>
        )}
        {loading && (
          <div className="p-20 flex justify-center items-center gap-3 text-blue-500 font-bold">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            データを読み込み中...
          </div>
        )}
      </div>
    </main>
  );
}