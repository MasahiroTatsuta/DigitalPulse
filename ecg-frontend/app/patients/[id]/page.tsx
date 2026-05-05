"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Patient = { id: number; name: string; age: number; gender: string };
type EcgRecord = { id: number; isAnomaly: boolean; recordedAt: string };

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<EcgRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      // 患者情報
      const pRes = await fetch(`${baseUrl}/api/patients/${id}`, { credentials: "include" });
      if (pRes.ok) setPatient(await pRes.json());
      // その患者の心電図履歴
      const eRes = await fetch(`${baseUrl}/api/ecg/search?patientId=${id}`, { credentials: "include" });
      if (eRes.ok) setRecords(await eRes.json());
    };
    fetchData();
  }, [id, baseUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", id as string); // 🌟 この患者IDで固定して送信！

    const res = await fetch(`${baseUrl}/api/ecg/import`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (res.ok) {
      alert("解析が完了しました");
      window.location.reload();
    }
    setIsUploading(false);
  };

  if (!patient) return <div className="p-10 text-center font-bold">Loading Chart...</div>;

  return (
    <main className="p-6 sm:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <Link href="/patients" className="text-xs font-bold text-blue-600 hover:underline">← Back to Directory</Link>
            <h1 className="text-4xl font-black text-slate-900 mt-2">{patient.name}</h1>
            <p className="text-slate-400 font-mono text-sm">Medical Record: PT-{patient.id.toString().padStart(4, '0')}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-8">
            <div className="text-center"><p className="text-[9px] font-black text-slate-300 uppercase">Age</p><p className="font-bold">{patient.age}</p></div>
            <div className="text-center"><p className="text-[9px] font-black text-slate-300 uppercase">Gender</p><p className="font-bold">{patient.gender}</p></div>
          </div>
        </header>

        {/* アップロードセクション */}
        <div className="bg-slate-900 rounded-3xl p-8 mb-10 text-white shadow-2xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">New ECG Measurement</h2>
            <p className="text-slate-400 text-xs mt-1">この患者の新しい心電図CSVデータを解析します</p>
          </div>
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tighter shadow-lg transition-all active:scale-95"
          >
            {isUploading ? "AI Analyzing..." : "Upload & Analyze ➔"}
          </button>
        </div>

        {/* 履歴リスト */}
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Measurement History</h3>
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} onClick={() => router.push(`/records/${r.id}`)} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-blue-300 cursor-pointer transition-all shadow-sm">
               <div className="flex items-center gap-4">
                  <span className={`w-3 h-3 rounded-full ${r.isAnomaly ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                  <span className="font-bold text-slate-700">Record #{r.id}</span>
               </div>
               <div className="flex items-center gap-6">
                  <span className="text-xs font-mono text-slate-400">{new Date(r.recordedAt).toLocaleString()}</span>
                  <span className="text-slate-300 font-black">➔</span>
               </div>
            </div>
          ))}
          {records.length === 0 && <p className="text-center py-10 text-slate-400 font-bold">検査履歴がありません</p>}
        </div>
      </div>
    </main>
  );
}