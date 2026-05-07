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

  const exportPDF = () => {
    if (exporting) return;
    setExporting(true);

    try {
      // ── DOM / CSS を一切経由しない純粋データ→HTML 方式 ─────────────────
      // html2canvas / html2pdf はページの CSS スタイルシートを読むため
      // Tailwind v4 の lab()/oklch() を避けられない。
      // そのためデータから直接 HTML 文字列を組み立て、
      // 新しいウィンドウで window.print() → PDF として保存 を使う。

      // 1. ECG 波形を SVG ポリラインとして描画
      const W = 750, H = 220;
      const voltages: number[] = chartData.map((d: any) => d.voltage as number);
      const minV = Math.min(...voltages);
      const maxV = Math.max(...voltages);
      const range = maxV - minV || 1;
      const points = voltages.map((v, i) => {
        const x = (i / Math.max(voltages.length - 1, 1)) * W;
        const y = H - ((v - minV) / range) * (H - 20) - 10;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");

      const accent = data?.isAnomaly ? "#ef4444" : "#3b82f6";
      const gridLines = [0,1,2,3,4].map(i => {
        const y = (10 + i * ((H - 20) / 4)).toFixed(1);
        return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
      }).join("");

      const svgChart = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.01"/>
    </linearGradient>
  </defs>
  ${gridLines}
  <polygon points="${points} ${W},${H} 0,${H}" fill="url(#wg)"/>
  <polyline points="${points}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;

      // 2. 印刷用 HTML — 全色を hex/rgb で直接指定（Tailwind CSS を一切使わない）
      const isAnomaly     = data?.isAnomaly;
      const diagnosisBg   = isAnomaly ? "#fef2f2"  : "#f0fdf4";
      const borderColor   = isAnomaly ? "#ef4444"  : "#22c55e";
      const badgeColor    = isAnomaly ? "#dc2626"  : "#16a34a";
      const badgeBg       = isAnomaly ? "#fee2e2"  : "#dcfce7";
      const badgeText     = isAnomaly ? "POSITIVE" : "NEGATIVE";
      const patientInitial = data?.patient?.name?.charAt(0) || "P";
      const patientName    = data?.patient?.name || "未登録";
      const patientIdStr   = (data?.patient?.id ?? 0).toString().padStart(4, "0");

      const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"/>
<title>ECG Report #${data?.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#111827;padding:32px}
.card{background:#fff;border-radius:20px;border:1px solid #f1f5f9;padding:40px;max-width:750px;margin:0 auto 24px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #f8fafc;padding-bottom:24px;margin-bottom:32px}
.brand{font-size:28px;font-weight:900;color:#111827;letter-spacing:-1px}
.brand span{color:#2563eb}
.brand-sub{font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-top:4px}
.meta{text-align:right;font-size:11px;color:#6b7280}
.pg{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}
.pl{display:flex;align-items:center;gap:20px}
.av{width:56px;height:56px;background:#eff6ff;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#2563eb}
.pn{font-size:18px;font-weight:900;color:#1f2937}
.pid{font-size:10px;color:#9ca3af;font-family:monospace;margin-top:2px}
.lbl{font-size:8px;font-weight:900;color:#d1d5db;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.pr{display:flex;gap:32px}
.val{font-size:14px;font-weight:900;color:#374151}
.banner{padding:20px 24px;border-radius:14px;border:1px solid #e5e7eb;border-left:10px solid ${borderColor};display:flex;justify-content:space-between;align-items:center;background:${diagnosisBg};margin-bottom:32px}
.dname{font-size:18px;font-weight:900;color:#1f2937}
.badge{padding:10px 28px;border-radius:12px;font-size:22px;font-weight:900;font-style:italic;color:${badgeColor};background:${badgeBg}}
.chart{border:1px solid #f1f5f9;border-radius:14px;padding:24px}
.slbl{font-size:9px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:20px}
.sbox{background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:20px;font-size:13px;line-height:1.7;color:#374151;font-style:italic;white-space:pre-wrap}
@media print{body{background:#fff;padding:0}.card{border:none}@page{margin:12mm;size:A4}}
</style></head><body>
<div class="card">
  <div class="hdr">
    <div><div class="brand">DigitalPulse <span>AI</span></div><div class="brand-sub">ECG Diagnostic Platform</div></div>
    <div class="meta"><div>ID: #${data?.id}</div><div style="font-weight:700;margin-top:2px">${new Date().toLocaleDateString("ja-JP")}</div></div>
  </div>
  <div class="pg">
    <div class="pl">
      <div class="av">${patientInitial}</div>
      <div>
        <div class="lbl">Patient Name</div>
        <div class="pn">${patientName}</div>
        <div class="pid">PT-${patientIdStr}</div>
      </div>
    </div>
    <div class="pr">
      <div><div class="lbl">Age</div><div class="val">${data?.patient?.age ?? "--"} y/o</div></div>
      <div><div class="lbl">Gender</div><div class="val">${data?.patient?.gender || "不明"}</div></div>
    </div>
  </div>
  <div class="banner">
    <div>
      <div class="lbl">Diagnostic Result</div>
      <div class="dname">${getDiagnosisName(data?.diagnosisType)}</div>
    </div>
    <div class="badge">${badgeText}</div>
  </div>
  <div class="chart">
    <div class="slbl">ECG Waveform</div>
    ${svgChart}
  </div>
</div>
<div class="card">
  <div style="font-size:13px;font-weight:900;color:#1f2937;text-transform:uppercase;margin-bottom:16px;">AI Analysis Summary</div>
  <div class="sbox">${comment || "解析データがありません。"}</div>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`;

      // 3. 新しいウィンドウで印刷ダイアログを起動（PDF として保存）
      const win = window.open("", "_blank", "width=900,height=700");
      if (!win) {
        alert("ポップアップがブロックされました。このサイトのポップアップを許可してください。");
        return;
      }
      win.document.write(html);
      win.document.close();

    } catch (error) {
      console.error("PDF生成エラー:", error);
      alert("PDF生成に失敗しました。");
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