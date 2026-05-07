"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";

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
  patient: Patient | null; 
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
        setComment(d.doctorComment || "");
        const rawWaveform: number[] = JSON.parse(d.waveformData);
        let lastIndex = rawWaveform.length - 1;
        while (lastIndex >= 0 && rawWaveform[lastIndex] === 0) lastIndex--;
        const waveform = rawWaveform.slice(0, lastIndex + 2).map((v, i) => ({ time: i, voltage: v }));
        setChartData(waveform);
      } catch (err) {
        console.error("❌ Data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [recordId, baseUrl]);

  // 🌟 PDF出力ロジックの修正版
  const exportPDF = async () => {
    if (!reportRef.current) return;
    const html2pdf = (await import("html2pdf.js" as any)).default;

    // 1. クローン作成 ＆ スタイル固定（labカラー対策 ＆ グラフサイズ対策）
    const clone = reportRef.current.cloneNode(true) as HTMLElement;
    document.body.appendChild(clone);

    const allElements = clone.getElementsByTagName("*");
    const originalElements = reportRef.current.getElementsByTagName("*");

    for (let i = 0; i < allElements.length; i++) {
      const target = allElements[i] as HTMLElement;
      const source = originalElements[i] as HTMLElement;
      const style = window.getComputedStyle(source);

      // Tailwind v4 の lab() / oklch() を RGB に強制変換
      target.style.color = style.color;
      target.style.backgroundColor = style.backgroundColor;
      target.style.borderColor = style.borderColor;
      target.style.fill = style.fill;

      // グラフサイズが -1 になるのを防ぐ (PDF内では固定幅)
      if (target.classList.contains('recharts-responsive-container')) {
        target.style.width = '700px';
        target.style.height = '300px';
      }
    }

    clone.style.position = "fixed";
    clone.style.top = "0";
    clone.style.left = "-9999px";
    clone.style.width = "800px";

    const opt = {
      margin: 10,
      filename: `ECG_Report_#${recordId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await (html2pdf as any)().set(opt).from(clone).save();
    } catch (error) {
      console.error("PDF生成中にエラーが発生しました:", error);
    } finally {
      document.body.removeChild(clone);
    }
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
    // 🌟 全体を overflow-x-hidden で包み、横揺れを防止
    <main className="p-4 sm:p-10 bg-gray-50 min-h-screen font-sans text-gray-900 overflow-x-hidden w-full max-w-full">
      <div className="flex justify-between items-center mb-8 no-print max-w-4xl mx-auto">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600">← Back</button>
        <button onClick={exportPDF} className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-full font-bold shadow-lg text-xs sm:text-base transition-all active:scale-95">📄 PDF Report</button>
      </div>

      <div ref={reportRef} className="max-w-4xl mx-auto space-y-6">
        {/* 患者情報カード - スマホではパディングを減らす(p-4) */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 border-b pb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter">DigitalPulse <span className="text-blue-600">AI</span></h1>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Clinical Analysis Report</p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-[10px] font-mono text-gray-400">REPORT_ID: #{data?.id}</p>
              <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString('ja-JP')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black text-blue-600">
                {data?.patient?.name ? data.patient.name.charAt(0) : "?"}
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Patient Name</p>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{data?.patient?.name || "未登録"}</h2>
                <p className="text-[10px] font-mono text-gray-500">{data?.patient?.id ? `PT-${data.patient.id.toString().padStart(4, '0')}` : "ID: ----"}</p>
              </div>
            </div>
            <div className="flex gap-8 md:justify-end text-sm">
              <div><p className="text-[9px] font-bold text-gray-400 uppercase">Age</p><p className="font-bold text-gray-700">{data?.patient?.age ?? "--"} y/o</p></div>
              <div><p className="text-[9px] font-bold text-gray-400 uppercase">Gender</p><p className="font-bold text-gray-700">{data?.patient?.gender || "不明"}</p></div>
            </div>
          </div>
        </div>

        {/* 判定結果 - スマホでは文字サイズ調整 */}
        <div className={`p-5 sm:p-8 rounded-2xl border-l-[8px] sm:border-l-[12px] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 bg-white ${data?.isAnomaly ? 'border-red-500' : 'border-green-500'}`}>
          <div className="text-center sm:text-left">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI Diagnostic Result</h3>
            <p className="text-lg sm:text-2xl font-black text-gray-800">{getDiagnosisName(data?.diagnosisType)}</p>
          </div>
          <div className={`w-full sm:w-auto px-6 py-2 sm:px-10 sm:py-4 rounded-xl text-2xl sm:text-4xl font-black italic tracking-tighter text-center ${data?.isAnomaly ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {data?.isAnomaly ? 'POSITIVE' : 'NEGATIVE'}
          </div>
        </div>

        {/* グラフカード - 100%幅を維持しつつ親を固定 */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Waveform Visualizer</h3>
          </div>
          <div className="h-[200px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorVolt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={data?.isAnomaly ? "#ef4444" : "#3b82f6"} stopOpacity={0.1}/><stop offset="95%" stopColor={data?.isAnomaly ? "#ef4444" : "#3b82f6"} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="voltage" stroke={data?.isAnomaly ? "#ef4444" : "#3b82f6"} strokeWidth={2} fillOpacity={1} fill="url(#colorVolt)" isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AIレポート */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">AI Generated Report</h3>
          </div>
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-[11px] sm:text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">
            {comment || "解析データがありません。"}
          </div>
        </div>
      </div>

      {/* 医師用メモ - スマホでは全幅 */}
      <div className="max-w-4xl mx-auto mt-8 p-6 sm:p-8 bg-slate-800 rounded-3xl shadow-2xl no-print">
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-4">医師による修正・追記</label>
        <textarea className="w-full h-32 p-4 bg-slate-900 border-none rounded-2xl text-slate-200 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none" value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="flex justify-end mt-4">
          <button onClick={saveComment} className="w-full sm:w-auto bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all">Update Report</button>
        </div>
      </div>
    </main>
  );
}