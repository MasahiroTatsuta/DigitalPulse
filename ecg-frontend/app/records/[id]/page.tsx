"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from "recharts";

// 型定義
type Patient = { id: number; name: string; age: number; gender: string };
type EcgRecord = { 
  id: number; 
  patient: Patient; 
  isAnomaly: boolean; 
  waveformData: string; 
  doctorComment?: string; 
  diagnosisType?: number; 
};

// 診断名の変換
const getDiagnosisName = (type: number | undefined) => {
  const names: { [key: number]: string } = { 
    0: "正常 (Normal)", 
    1: "上室性期外収縮 (SVEB)", 
    2: "心室性期外収縮 (VEB)", 
    3: "心室融合不整脈 (F)", 
    4: "分類不能な不整脈 (Q)" 
  };
  return names[type ?? 0] || "不明な波形";
};

export default function RecordDetailPage() {
  const { id: recordId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<EcgRecord | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  // PDF出力対象の参照
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`http://localhost:8080/api/ecg/${recordId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setComment(d.doctorComment || "");
        const rawWaveform: number[] = JSON.parse(d.waveformData);
        let lastIndex = rawWaveform.length - 1;
        while (lastIndex >= 0 && rawWaveform[lastIndex] === 0) {
          lastIndex--;
        }
        const trimmedData = rawWaveform.slice(0, lastIndex + 2);
        const waveform = trimmedData.map((v: number, i: number) => ({ 
          time: i, 
          voltage: v 
        }));
        setChartData(waveform);
        setLoading(false);
      })
      .catch(err => {
        console.error("Data fetch error:", err);
        setLoading(false);
      });
  }, [recordId]);

  // PDF出力機能
  const exportPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    if (!reportRef.current) return;

    const opt = {
      margin:       10,
      filename:     `ECG_Report_PT-${data?.patient.id}_${recordId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 } as const,
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        logging: false,
        // クローン時にスタイルを強制上書きしてlab()エラーを回避
        onclone: (doc: Document) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach((node) => {
            const el = node as HTMLElement;
            const style = window.getComputedStyle(el);
            if (el.style) {
              el.style.color = style.color;
              el.style.backgroundColor = style.backgroundColor;
              el.style.borderColor = style.borderColor;
            }
          });
        }
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' } as const
    };

    try {
      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("PDFの生成に失敗しました。ブラウザのコンソールを確認してください。");
    }
  };

  const saveComment = async () => {
    const res = await fetch(`http://localhost:8080/api/ecg/${recordId}/comment`, {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: comment
    });
    if (res.ok) alert("診断内容を保存しました。");
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">データを読み込み中...</div>;

  return (
    <main className={`p-4 sm:p-10 min-h-screen ${data?.isAnomaly ? "bg-red-50" : "bg-gray-50"}`}>
      
      {/* 操作バー (PDFには含まない) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <button 
          onClick={() => router.push('/')} 
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-bold shadow-sm transition-all"
        >
          ◀ 一覧に戻る
        </button>

        <button 
          onClick={exportPDF} 
          className="flex items-center gap-2 px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95"
        >
          📄 レポートをPDF出力
        </button>
      </div>

      {/* --- ↓ PDF出力エリア ↓ --- */}
      <div ref={reportRef} style={{ backgroundColor: 'transparent' }}>
        
        {/* レポートヘッダー (PDFで映える) */}
        <div className="mb-6 p-4 border-b-2" style={{ borderColor: '#374151', backgroundColor: '#ffffff' }}>
           <h1 className="text-2xl font-black" style={{ color: '#111827' }}>ECG CLINICAL REPORT</h1>
           <p className="text-xs" style={{ color: '#6b7280' }}>Issue Date: {new Date().toLocaleString()}</p>
        </div>

        {/* 患者情報カード */}
        <div className="p-6 rounded-xl border mb-6 flex flex-col md:flex-row gap-6 items-center" 
             style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
          <div className="flex items-center gap-4 w-full md:w-auto border-b md:border-b-0 pb-4 md:pb-0">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl text-white flex-shrink-0" 
                 style={{ backgroundColor: '#2563eb' }}>
              {data?.patient.name.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Patient Name</p>
              <p className="text-xl font-black" style={{ color: '#111827' }}>{data?.patient.name}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 sm:gap-12 w-full">
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>Patient ID</p>
              <p className="font-mono font-bold" style={{ color: '#374151' }}>PT-{data?.patient.id.toString().padStart(4, '0')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>Age / Gender</p>
              <p className="font-bold" style={{ color: '#374151' }}>{data?.patient.age}y / {data?.patient.gender}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>Record ID</p>
              <p className="font-bold" style={{ color: '#374151' }}>#{data?.id}</p>
            </div>
          </div>
        </div>

        {/* 診断結果ラベル */}
        <div className="p-6 mb-6 rounded-xl border-l-8 flex flex-col sm:flex-row justify-between items-center gap-4" 
             style={{ 
               backgroundColor: '#ffffff', 
               borderColor: data?.isAnomaly ? '#ef4444' : '#22c55e',
               borderLeftWidth: '8px',
               borderLeftStyle: 'solid'
             }}>
          <div className="text-center sm:text-left">
            <h2 className="font-bold uppercase text-[10px] tracking-widest" style={{ color: '#9ca3af' }}>AI Diagnosis</h2>
            <p className="text-2xl font-black" style={{ color: '#111827' }}>{getDiagnosisName(data?.diagnosisType)}</p>
          </div>
          <div className="px-8 py-3 rounded-lg font-black text-3xl" 
               style={{ 
                 backgroundColor: data?.isAnomaly ? '#fef2f2' : '#f0fdf4', 
                 color: data?.isAnomaly ? '#dc2626' : '#16a34a' 
               }}>
            {data?.isAnomaly ? 'POSITIVE' : 'NEGATIVE'}
          </div>
        </div>

        {/* グラフエリア */}
        <div className="p-4 rounded-xl border mb-6" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
          <h3 className="text-[10px] font-bold mb-4 uppercase tracking-widest" style={{ color: '#9ca3af' }}>Waveform Analysis</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} stroke="#ccc" fontSize={10} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="voltage" 
                  stroke={data?.isAnomaly ? "#ef4444" : "#2563eb"} 
                  strokeWidth={2.5} 
                  dot={false} 
                  isAnimationActive={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 診断メモ表示エリア (PDF用) */}
        <div className="p-6 rounded-xl border" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#374151' }}>
            🩺 Clinical Notes
          </h3>
          <div className="p-5 rounded-lg border text-sm leading-relaxed min-h-[120px] whitespace-pre-wrap" 
               style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#1f2937' }}>
            {comment || "No notes provided."}
          </div>
        </div>
      </div>
      {/* --- ↑ PDF出力エリア終了 ↑ --- */}

      {/* 編集フォーム (PDFには含めない) */}
      <div className="mt-10 p-6 bg-white rounded-xl border border-gray-300 shadow-inner">
        <label className="block text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">診断メモを編集</label>
        <textarea 
          className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all text-gray-800" 
          value={comment} 
          onChange={(e) => setComment(e.target.value)} 
          placeholder="医師の所見を入力してください..." 
        />
        <div className="text-right mt-4">
          <button 
            onClick={saveComment} 
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-lg font-black shadow-md transition-all active:scale-95"
          >
            保存する
          </button>
        </div>
      </div>
    </main>
  );
}