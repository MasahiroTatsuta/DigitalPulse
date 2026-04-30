"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Patient = { id: number; name: string };
type EcgRecord = { id: number; patient: Patient; isAnomaly: boolean };

export default function DashboardPage() {
  const [records, setRecords] = useState<EcgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [onlyAnomaly, setOnlyAnomaly] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchId) params.append("patientId", searchId);
    if (onlyAnomaly) params.append("isAnomaly", "true");
    
    try {
      const res = await fetch(`http://localhost:8080/api/ecg/search?${params}`);
      const data = await res.json();
      setRecords(data);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [onlyAnomaly]);

  return (
    <main className="p-4 sm:p-10 bg-gray-50 min-h-screen">
      {/* ヘッダーエリア */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 border-b-4 border-blue-500 pb-1">
          診断データ・サーチ
        </h1>
        <button 
          onClick={() => signOut()} 
          className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors"
        >
          Sign Out ➔
        </button>
      </div>

      {/* 検索パネル (レスポンシブ対応) */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Search by Patient ID</label>
          <div className="flex gap-2">
            <input 
              type="number" value={searchId} onChange={(e)=>setSearchId(e.target.value)} 
              className="flex-1 md:w-48 border-2 border-gray-100 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition-all" 
              placeholder="Ex: 25" 
            />
            <button onClick={fetchRecords} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md">
              検索
            </button>
          </div>
        </div>

        <div 
          className="flex items-center gap-3 py-2 cursor-pointer select-none" 
          onClick={()=>setOnlyAnomaly(!onlyAnomaly)}
        >
          <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${onlyAnomaly ? "bg-red-500" : "bg-gray-300"}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${onlyAnomaly ? "translate-x-6" : ""}`} />
          </div>
          <span className="font-bold text-gray-700 text-sm">異常データのみ表示</span>
        </div>
      </div>

      {/* テーブルエリア */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-gray-100">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-4">Record ID</th>
              <th className="p-4">Patient</th>
              <th className="p-4">AI Status</th>
              <th className="p-4 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {records.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors">
                <td className="p-4 font-bold text-gray-400">#{r.id}</td>
                <td className="p-4 font-black">PT-{r.patient?.id?.toString().padStart(4, '0')}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${r.isAnomaly ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                    {r.isAnomaly ? "ANOMALY" : "NORMAL"}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <Link href={`/records/${r.id}`}>
                    <button className="bg-gray-800 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-black transition-all">
                      Analysis ➔
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && !loading && (
          <div className="p-20 text-center text-gray-400 font-bold">該当するデータは見つかりませんでした。</div>
        )}
      </div>
    </main>
  );
}