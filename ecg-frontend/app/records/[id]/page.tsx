"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";

// 診断名定義
const getDiagnosisName = (type: number | undefined) => {
  const names: { [key: number]: string } = { 
    0: "正常 (Normal Sinus Rhythm)", 
    1: "上室性期外収縮 (SVEB)", 
    2: "心室性期外収縮 (VEB)", 
    3: "心室融合不整脈 (Fusion Beat)", 
    4: "分類不能な不整脈 (Unknown/Q)" 
  };
  return names[type ?? 0] || "解析不能な波形";
};

type Patient = { id: number; name: string; age: number; gender: string };
type EcgRecord = { 
  id: number; 
  patient: Patient; 
  isAnomaly: boolean; 
  waveformData: string; 
  doctorComment?: string; 
  diagnosisType?: number; 
};

export default function RecordDetailPage() {
  const { id: recordId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<EcgRecord | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const reportRef = useRef<HTMLDivElement>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/ecg/${recordId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Fetch failed");
        const d = await res.json();
        
        setData(d);
        // AIが生成したレポートを初期値としてセット
        setComment(d.doctorComment || "");

        // 波形データのパースとトリミング
        const rawWaveform: number[] = JSON.parse(d.waveformData);
        let lastIndex = rawWaveform.length - 1;
        while (lastIndex >= 0 && rawWaveform[lastIndex] === 0) lastIndex--;
        
        const waveform = rawWaveform.slice(0, lastIndex + 2).map((v, i) => ({
          time: i,
          voltage: v,
        }));
        setChartData(waveform);

      } catch (err) {
        console.error("❌ Data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [recordId, baseUrl]);

  const exportPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    if (!reportRef.current) return;
    const opt = {
      margin: 10,
      filename: `ECG_Report_#${recordId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    await html2pdf().set(opt).from(reportRef.current).save();
  };

  const saveComment = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/ecg/${recordId}/comment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: comment,
      });
      if (res.ok) alert("診断メモを更新しました");
    } catch (err) {
      alert("保存に失敗しました");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <main className="p-4 sm:p-10 bg-gray-50 min-h-screen font-sans">
      
      {/* ナビゲーション */}
      <div className="flex justify-between items-center mb-8 no-print">
        <button 
          onClick={() => router.push('/')} 
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-all"
        >
          ← Dashboard
        </button>
        <button 
          onClick={exportPDF} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          📄 PDF Report
        </button>
      </div>

      <div ref={reportRef} className="max-w-4xl mx-auto space-y-6">
        
        {/* レポートヘッダー */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">DigitalPulse <span className="text-blue-600">AI</span></h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Clinical Analysis Report</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-gray-400">REPORT_ID: #{data?.id}</p>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString('ja-JP')}</p>
            </div>
          </div>

          {/* 患者情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-600">
                {data?.patient.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Patient Name</p>
                <h2 className="text-xl font-bold text-gray-800">{data?.patient.name}</h2>
                <p className="text-xs font-mono text-gray-500">PT-{data?.patient.id.toString().padStart(4, '0')}</p>
              </div>
            </div>
            <div className="flex gap-10 md:justify-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Age</p>
                <p className="font-bold text-gray-700">{data?.patient.age} y/o</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Gender</p>
                <p className="font-bold text-gray-700">{data?.patient.gender}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI診断サマリー */}
        <div className={`p-8 rounded-2xl border-l-[12px] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6 bg-white ${data?.isAnomaly ? 'border-red-500' : 'border-green-500'}`}>
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI Diagnostic Result</h3>
            <p className="text-2xl font-black text-gray-800">{getDiagnosisName(data?.diagnosisType)}</p>
          </div>
          <div className={`px-10 py-4 rounded-xl text-4xl font-black italic tracking-tighter ${data?.isAnomaly ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {data?.isAnomaly ? 'POSITIVE' : 'NEGATIVE'}
          </div>
        </div>

        {/* 波形グラフ */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Waveform Visualizer</h3>
            <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-500 rounded">Lead II Standard</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVolt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={data?.isAnomaly ? "#ef4444" : "#3b82f6"} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={data?.isAnomaly ? "#ef4444" : "#3b82f6"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                   labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="voltage" 
                  stroke={data?.isAnomaly ? "#ef4444" : "#3b82f6"} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVolt)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 診断レポート（AI生成メッセージ） */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-gray-800 uppercase tracking-tight">AI Generated Clinical Report</h3>
          </div>
          <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">
            {comment || "解析データがありません。"}
          </div>
        </div>
      </div>

      {/* 編集エリア (no-print) */}
      <div className="max-w-4xl mx-auto mt-12 p-8 bg-slate-800 rounded-3xl shadow-2xl no-print">
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">医師による修正・追記</label>
          <span className="text-[10px] text-slate-500">※保存するとAIレポートが更新されます</span>
        </div>
        <textarea 
          className="w-full h-40 p-6 bg-slate-900 border-none rounded-2xl text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
          value={comment} 
          onChange={(e) => setComment(e.target.value)} 
          placeholder="所見を記入してください..." 
        />
        <div className="flex justify-end mt-6">
          <button 
            onClick={saveComment} 
            className="bg-blue-500 hover:bg-blue-400 text-white px-12 py-4 rounded-xl font-black shadow-lg transition-all active:scale-95"
          >
            Update Report
          </button>
        </div>
      </div>
    </main>
  );
}