"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
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
  const [records, setRecords] = useState<EcgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");
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
        alert("アップロード失敗");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      setTargetPatientId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [onlyAnomaly]);

  return (
    <main className="p-4 sm:p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 border-b-4 border-blue-500 pb-1">DigitalPulse Dashboard</h1>
        <button onClick={() => signOut()} className="text-sm font-bold text-gray-500 hover:text-red-500">Sign Out ➔</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Patient ID Search</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 border-2 border-gray-100 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                placeholder="Ex: 25"
              />
              <button onClick={fetchRecords} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">検索</button>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2 cursor-pointer select-none" onClick={() => setOnlyAnomaly(!onlyAnomaly)}>
            <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${onlyAnomaly ? "bg-red-500" : "bg-gray-300"}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${onlyAnomaly ? "translate-x-6" : ""}`} />
            </div>
            <span className="font-bold text-gray-700 text-sm">異常のみ表示</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-dashed border-blue-300 flex flex-col justify-center gap-3">
          <p className="text-xs font-bold text-blue-400 uppercase text-center">Bulk Import with Patient ID</p>
          <input 
            type="number"
            placeholder="紐付ける患者IDを入力"
            value={targetPatientId}
            onChange={(e) => setTargetPatientId(e.target.value)}
            className="w-full border border-blue-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-full py-3 rounded-lg font-black text-xs uppercase shadow-lg ${isUploading ? 'bg-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white ring-2 ring-blue-600'}`}
          >
            {isUploading ? "Uploading..." : "CSVを選択して登録"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-100">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-widest">
            <tr><th className="p-4">ID</th><th className="p-4">Patient</th><th className="p-4">Status</th><th className="p-4">AI Doctor's Summary</th><th className="p-4 text-center">Action</th></tr>
          </thead>
          <tbody className="text-gray-700">
            <AnimatePresence>
              {records.map((r) => (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={r.id} className="border-b border-gray-50 hover:bg-blue-50/50">
                  <td className="p-4 font-bold text-gray-400">#{r.id}</td>
                  <td className="p-4 font-black">{r.patient ? `PT-${r.patient.id.toString().padStart(4, "0")}` : "GUEST"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${r.isAnomaly ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {r.isAnomaly ? "ANOMALY" : "NORMAL"}
                    </span>
                  </td>
                  <td className="p-4"><div className="max-w-md"><p className="text-xs text-gray-600 line-clamp-2 italic">{r.doctorComment || "解析待ち..."}</p></div></td>
                  <td className="p-4 text-center">
                    <Link href={`/records/${r.id}`}>
                      <button className="bg-gray-800 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-black">VIEW REPORT ➔</button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </main>
  );
}