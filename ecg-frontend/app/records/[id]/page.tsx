"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, AreaChart, Area
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
  const [exporting, setExporting] = useState(false);
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

  const exportPDF = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);

    try {
      // ── 1. html-to-image でスナップショット取得 ──────────────────────────
      //    html-to-image は CSSOM を自前でシリアライズするため
      //    lab() / oklch() などの未サポートカラーを含む computedStyle を
      //    そのまま扱わずに済み、html2pdf の jsPDF パーサが詰まらない。
      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 2,            // Retina 相当の解像度
        backgroundColor: "#ffffff",
        // フォント埋め込みを試みる（CORS が許可されている場合のみ有効）
        includeQueryParams: true,
      });

      // ── 2. jsPDF で A4 PDF に貼り付け ────────────────────────────────────
      const { jsPDF } = await import("jspdf");

      const A4_W_MM = 210;
      const A4_H_MM = 297;
      const MARGIN_MM = 10;

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      // 画像の実サイズ (px) を取得して mm に換算
      const img = new Image();
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = dataUrl; });

      const imgW_px = img.naturalWidth;
      const imgH_px = img.naturalHeight;

      const printW_mm = A4_W_MM - MARGIN_MM * 2;
      const printH_mm = (imgH_px / imgW_px) * printW_mm;

      // 複数ページに分割して出力
      const pageContentH_mm = A4_H_MM - MARGIN_MM * 2;
      let yOffset = 0;
      let isFirstPage = true;

      while (yOffset < printH_mm) {
        if (!isFirstPage) pdf.addPage();

        const sliceH_mm = Math.min(pageContentH_mm, printH_mm - yOffset);
        const sliceH_px = (sliceH_mm / printH_mm) * imgH_px;
        const sliceY_px = (yOffset / printH_mm) * imgH_px;

        // Canvas でスライスを切り出す
        const canvas = document.createElement("canvas");
        canvas.width = imgW_px;
        canvas.height = Math.ceil(sliceH_px);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, -sliceY_px);

        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", MARGIN_MM, MARGIN_MM, printW_mm, sliceH_mm);

        yOffset += sliceH_mm;
        isFirstPage = false;
      }

      pdf.save(`ECG_Report_#${recordId}.pdf`);
    } catch (error) {
      console.error("PDF生成エラー:", error);
      alert("PDF生成に失敗しました。ブラウザのコンソールを確認してください。");
    } finally {
      setExporting(false);
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
    } catch {
      alert("保存に失敗しました");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  // ── Recharts: ResponsiveContainer を廃止し固定サイズで描画 ───────────────
  // ResponsiveContainer は DOM サイズを読んでから内部に幅/高さを渡すが、
  // PDF 生成中（hidden clone など）ではサイズが -1 になり警告が出る。
  // 固定の width / height を直接指定することで問題を完全に回避する。
  const CHART_WIDTH = 700;
  const CHART_HEIGHT = 250;
  const chartColor = data?.isAnomaly ? "#ef4444" : "#3b82f6";

  return (
    <main className="p-4 sm:p-10 bg-gray-50 min-h-screen font-sans text-gray-900 overflow-x-hidden w-full">
      {/* ナビゲーション (印刷対象外) */}
      <div className="flex justify-between items-center mb-8 no-print max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
        >
          ← Dashboard
        </button>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-black shadow-lg text-[10px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exporting ? "⏳ Generating..." : "📄 Download Report"}
        </button>
      </div>

      {/* ── PDF に含まれるレポート本体 ─────────────────────────────────────── */}
      <div ref={reportRef} className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
          {/* ヘッダー */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 border-b border-gray-50 pb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                DigitalPulse <span className="text-blue-600">AI</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ECG Diagnostic Platform</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-mono text-gray-400">ID: #{data?.id}</p>
              <p className="text-xs font-bold text-gray-500">{new Date().toLocaleDateString('ja-JP')}</p>
            </div>
          </div>

          {/* 患者情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-600">
                {data?.patient?.name?.charAt(0) || "P"}
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Patient Name</p>
                <h2 className="text-xl font-black text-gray-800">{data?.patient?.name || "未登録"}</h2>
                <p className="text-xs font-mono text-gray-400">
                  PT-{data?.patient?.id.toString().padStart(4, '0')}
                </p>
              </div>
            </div>
            <div className="flex gap-8 md:justify-end text-sm">
              <div>
                <p className="text-[9px] font-black text-gray-300 uppercase">Age</p>
                <p className="font-black text-gray-700">{data?.patient?.age ?? "--"} y/o</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-300 uppercase">Gender</p>
                <p className="font-black text-gray-700">{data?.patient?.gender || "不明"}</p>
              </div>
            </div>
          </div>

          {/* 診断結果バナー */}
          <div className={`p-6 rounded-2xl border-l-[12px] flex flex-col sm:flex-row justify-between items-center gap-4 bg-white shadow-sm mb-10 ${data?.isAnomaly ? 'border-red-500' : 'border-green-500'}`}>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase mb-1">Diagnostic Result</h3>
              <p className="text-xl font-black text-gray-800">{getDiagnosisName(data?.diagnosisType)}</p>
            </div>
            <div className={`px-8 py-3 rounded-xl text-3xl font-black italic ${data?.isAnomaly ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {data?.isAnomaly ? 'POSITIVE' : 'NEGATIVE'}
            </div>
          </div>

          {/* ECG 波形グラフ
              ★ ResponsiveContainer を廃止し width/height を直接指定
                 → PDF 生成時の width(-1)/height(-1) 警告が消える         */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 w-full overflow-x-auto">
            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">ECG Waveform</h3>
            <AreaChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              data={chartData}
              style={{ maxWidth: "100%" }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" hide />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#cbd5e1"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="voltage"
                stroke={chartColor}
                strokeWidth={3}
                fillOpacity={0.1}
                fill={chartColor}
                isAnimationActive={false}
              />
            </AreaChart>
          </div>
        </div>

        {/* AI Analysis Summary */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 uppercase text-sm mb-4">AI Analysis Summary</h3>
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap italic">
            {comment || "解析データがありません。"}
          </div>
        </div>
      </div>

      {/* ── Doctor's Notes (印刷対象外) ───────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mt-12 p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl no-print">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">
          Doctor&apos;s Clinical Notes
        </label>
        <textarea
          className="w-full h-40 p-6 bg-slate-950 border-none rounded-3xl text-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none font-medium"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex justify-end mt-6">
          <button
            onClick={saveComment}
            className="w-full sm:w-auto bg-blue-600 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-500 active:scale-95 transition-all"
          >
            Update Report
          </button>
        </div>
      </div>
    </main>
  );
}