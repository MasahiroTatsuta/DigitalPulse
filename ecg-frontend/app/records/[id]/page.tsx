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
        // 末尾の0（パディング）をカットするロジック
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

  // 🌟 PDF出力ロジック：lab()カラーエラー & サイズ警告を徹底対策
  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    const html2pdf = (await import("html2pdf.js" as any)).default;

    // 1. クローンを作成
    const clone = reportRef.current.cloneNode(true) as HTMLElement;
    document.body.appendChild(clone);

    // 2. スタイルの徹底「平坦化」
    const allElements = clone.getElementsByTagName("*");
    const originalElements = reportRef.current.getElementsByTagName("*");

    for (let i = 0; i < allElements.length; i++) {
      const target = allElements[i] as HTMLElement;
      const source = originalElements[i] as HTMLElement;
      const style = window.getComputedStyle(source);

      // 【重要】Tailwind v4 の lab/oklch をブラウザ計算済みの RGB に変換して注入
      target.style.color = style.color;
      target.style.backgroundColor = style.backgroundColor;
      target.style.borderColor = style.borderColor;
      target.style.fill = style.fill;
      target.style.stroke = style.stroke;
      
      // 影(box-shadow)は lab() が混じりやすいためPDFでは無効化
      target.style.boxShadow = "none";

      // 【重要】Rechartsコンテナに固定サイズを強制（width -1 回避）
      if (target.classList.contains('recharts-responsive-container')) {
        target.style.width = '750px';   
        target.style.height = '350px';  
        target.style.visibility = 'visible';
        target.style.opacity = '1';
      }
    }

    clone.style.position = "fixed";
    clone.style.top = "0";
    clone.style.left = "-9999px";
    clone.style.width = "800px"; 
    clone.style.display = "block";

    const opt = {
      margin: [10, 10],
      filename: `ECG_Report_#${recordId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await (html2pdf as any)().set(opt).from(clone).save();
    } catch (error) {
      console.error("PDF生成エラー:", error);
      alert("PDFの生成に失敗しました。");
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
    // overflow-x-hidden でスマホでの横揺れを防止
    <main className="p-4 sm:p-10 bg-gray-50 min-h-screen font-sans text-gray-900 overflow-x-hidden w-full">
      
      {/* 操作ボタンエリア */}
      <div className="flex justify-between items-center mb-8 no-print max-w-4xl mx-auto">
        <button 
          onClick={() => router.push('/')} 
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
        >
          ← Dashboard
        </button>
        <button 
          onClick={exportPDF} 
          className="bg-blue-600 text-white px-5 py-2 sm:px-8 sm:py-3 rounded-full font-black shadow-xl text-[10px] sm:text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all"
        >
          📄 Download PDF Report
        </button>
      </div>

      <div ref={reportRef} className="max-w-4xl mx-auto space-y-6">
        
        {/* 患者情報セクション */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-10 border-b border-gray-50 pb-10 gap-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                DigitalPulse <span className="text-blue-600">AI</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">
                Cardiology Diagnostic Report
              </p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-[10px] font-mono text-gray-400">RECORD_ID: #{data?.id}</p>
              <p className="text-[11px] font-bold text-gray-500 mt-1">
                {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-2xl sm:text-3xl font-black text-blue-600 shadow-inner">
                {data?.patient?.name ? data.patient.name.charAt(0) : "P"}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Patient Subject</p>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800 truncate">
                  {data?.patient?.name || "Anonymous Patient"}
                </h2>
                <p className="text-[11px] font-mono text-gray-400 mt-1">
                  {data?.patient?.id ? `PT-${data.patient.id.toString().padStart(4, '0')}` : "UNREGISTERED"}
                </p>
              </div>
            </div>
            <div className="flex gap-10 md:justify-end">
              <div className="text-center sm:text-right">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Age</p>
                <p className="text-xl font-black text-gray-700">{data?.patient?.age ?? "--"}<span className="text-xs ml-1 text-gray-400">y/o</span></p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Gender</p>
                <p className="text-xl font-black text-gray-700 uppercase">{data?.patient?.gender || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 診断ステータス */}
        <div className={`p-6 sm:p-10 rounded-3xl border-l-[12px] sm:border-l-[20px] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6 bg-white transition-all ${data?.isAnomaly ? 'border-red-500 shadow-red-100/50' : 'border-green-500 shadow-green-100/50'}`}>
          <div className="text-center sm:text-left">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Automated Diagnostic Result</h3>
            <p className="text-xl sm:text-3xl font-black text-gray-800 leading-tight">
              {getDiagnosisName(data?.diagnosisType)}
            </p>
          </div>
          <div className={`w-full sm:w-auto px-8 py-4 sm:px-12 sm:py-6 rounded-2xl text-2xl sm:text-5xl font-black italic tracking-tighter text-center shadow-sm ${data?.isAnomaly ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {data?.isAnomaly ? 'POSITIVE' : 'NEGATIVE'}
          </div>
        </div>

        {/* グラフ表示セクション */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-100 w-full overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">High-Resolution Waveform</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Live Rendering</span>
            </div>
          </div>
          <div className="h-[250px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVolt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={data?.isAnomaly ? "#ef4444" : "#3b82f6"} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={data?.isAnomaly ? "#ef4444" : "#3b82f6"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} stroke="#cbd5e1" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip />
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

        {/* AIレポート詳細 */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-gray-800 uppercase tracking-tight text-base">AI Generated Clinical Report</h3>
          </div>
          <div className="p-6 sm:p-8 bg-blue-50/30 rounded-[2rem] border border-blue-100/50 text-sm sm:text-base leading-relaxed text-gray-700 whitespace-pre-wrap font-medium italic">
            {comment || "解析データが読み込めません。再度実行してください。"}
          </div>
        </div>
      </div>

      {/* 医師用追記フォーム (印刷対象外) */}
      <div className="max-w-4xl mx-auto mt-12 p-8 sm:p-10 bg-slate-900 rounded-[3rem] shadow-2xl no-print">
        <div className="flex items-center justify-between mb-6">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
            Professional Clinical Notes
          </label>
          <span className="text-[10px] text-slate-600 font-bold italic">※Auto-saves to database</span>
        </div>
        <textarea 
          className="w-full h-48 p-6 bg-slate-950 border-none rounded-3xl text-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none font-medium leading-relaxed" 
          placeholder="所見を入力してください..."
          value={comment} 
          onChange={(e) => setComment(e.target.value)} 
        />
        <div className="flex justify-end mt-6">
          <button 
            onClick={saveComment} 
            className="w-full sm:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-500 active:scale-95 transition-all"
          >
            Update Diagnosis Report
          </button>
        </div>
      </div>
    </main>
  );
}