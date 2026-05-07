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
      const source = reportRef.current;

      // ── Step 1: cloneNode して computedStyle で lab() を RGB に正規化 ──────
      // jsPDF の内蔵カラーパーサは lab()/oklch() を解釈できないため、
      // ブラウザが計算済みの RGB 値で全要素を上書きしてからキャプチャする。
      const clone = source.cloneNode(true) as HTMLElement;
      clone.style.cssText = `
        position: fixed; top: 0; left: -9999px;
        width: ${source.offsetWidth}px; z-index: -1;
      `;
      document.body.appendChild(clone);

      const srcEls   = Array.from(source.querySelectorAll("*")) as HTMLElement[];
      const cloneEls = Array.from(clone.querySelectorAll("*"))   as HTMLElement[];
      srcEls.forEach((src, i) => {
        const cs  = window.getComputedStyle(src);
        const el  = cloneEls[i] as HTMLElement;
        el.style.color           = cs.color;
        el.style.backgroundColor = cs.backgroundColor;
        el.style.borderColor     = cs.borderColor;
        el.style.outlineColor    = cs.outlineColor;
        el.style.boxShadow       = "none";
        el.style.textShadow      = "none";
      });

      // ── Step 2: html2canvas でキャプチャ ────────────────────────────────
      // html2canvas は html2pdf.js の依存として既にバンドル済みなので
      // 追加 install 不要。直接 import して使う。
      // @ts-ignore
      const html2canvas = (await import("html2canvas")).default;
      const canvas: HTMLCanvasElement = await (html2canvas as any)(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: false,
        foreignObjectRendering: false,
      });

      document.body.removeChild(clone);

      // ── Step 3: jsPDF に貼り付けて複数ページ対応で保存 ─────────────────
      const { jsPDF } = await import("jspdf");
      const A4_W = 210, A4_H = 297, M = 10;
      const printW = A4_W - M * 2;
      const printH = (canvas.height / canvas.width) * printW;
      const pageH  = A4_H - M * 2;

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      let yOff = 0, first = true;

      while (yOff < printH) {
        if (!first) pdf.addPage();
        const sliceH_mm = Math.min(pageH, printH - yOff);
        const sliceH_px = Math.ceil((sliceH_mm / printH) * canvas.height);
        const sliceY_px = Math.ceil((yOff      / printH) * canvas.height);

        const pg = document.createElement("canvas");
        pg.width  = canvas.width;
        pg.height = sliceH_px;
        pg.getContext("2d")!.drawImage(
          canvas, 0, sliceY_px, canvas.width, sliceH_px,
                  0, 0,         canvas.width, sliceH_px
        );
        pdf.addImage(pg.toDataURL("image/jpeg", 0.97), "JPEG", M, M, printW, sliceH_mm);

        yOff += sliceH_mm;
        first = false;
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