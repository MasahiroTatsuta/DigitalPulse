"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion"; // package.jsonにあったので活用

// 型定義をバックエンドの最新状態に合わせる
type EcgRecord = { 
  id: number; 
  patientId?: number; // バックエンドのフィールド名に合わせる
  isAnomaly: boolean; 
  doctorComment: string | null;
  waveformData: string;
};

export default function DashboardPage() {
  const [records, setRecords] = useState<EcgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [onlyAnomaly, setOnlyAnomaly] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";
      
      // 検索IDがある場合はsearch、ない場合はallを叩く
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
      
      // searchIdがない時でもフロント側で「異常のみ」フィルタをかけられるように
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

  // CSVインポート処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";
      const res = await fetch(`${baseUrl}/api/ecg/import`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (res.ok) {
        alert("CSVのインポートとAI解析を開始しました。完了まで数分かかる場合があります。");
        fetchRecords(); // リスト更新
      } else {
        alert("アップロードに失敗しました。");
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [onlyAnomaly]);

  return (
    <main className="p-4 sm:p-10 bg-gray-50 min-h-screen">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 border-b-4 border-blue-500 pb-1">
            DigitalPulse Dashboard
          </h1>
          <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">AI-Powered Heartbeat Analysis</span>
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
        >
          Sign Out ➔
        </button>
      </div>

      {/* アクションパネル (検索 + インポート) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 検索・フィルタ（既存機能を維持） */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Patient ID Search</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 border-2 border-gray-100 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: 25"
              />
              <button onClick={fetchRecords} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all">検索</button>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2 cursor-pointer select-none" onClick={() => setOnlyAnomaly(!onlyAnomaly)}>
            <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${onlyAnomaly ? "bg-red-500" : "bg-gray-300"}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${onlyAnomaly ? "translate-x-6" : ""}`} />
            </div>
            <span className="font-bold text-gray-700 text-sm">異常のみ表示</span>
          </div>
        </div>

        {/* CSVインポート（新規追加） */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed border-blue-300 flex flex-col justify-center items-center gap-3">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Bulk Import (Kaggle CSV)</p>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full py-3 rounded-lg font-black text-xs uppercase tracking-tighter transition-all shadow-lg ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white ring-2 ring-blue-600'}`}
          >
            {isUploading ? "Processing..." : "CSVファイルをアップロード"}
          </button>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-100">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Status</th>
              <th className="p-4">AI Doctor's Summary</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <AnimatePresence>
              {records.map((r) => (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={r.id}
                  className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
                >
                  <td className="p-4 font-bold text-gray-400">#{r.id}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${r.isAnomaly ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {r.isAnomaly ? "ANOMALY" : "NORMAL"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="max-w-md">
                      <p className="text-xs text-gray-600 line-clamp-2 italic leading-relaxed">
                        {r.doctorComment ? r.doctorComment : "⚠️ 解析待ち、またはレポートがありません。"}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <Link href={`/records/${r.id}`}>
                      <button className="bg-gray-800 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all shadow-sm">
                        VIEW REPORT ➔
                      </button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {records.length === 0 && !loading && (
          <div className="p-20 text-center text-gray-400 font-bold">
            該当するデータは見つかりませんでした。
          </div>
        )}
      </div>
    </main>
  );
}