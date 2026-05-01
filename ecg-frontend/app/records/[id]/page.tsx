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

// 診断名
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

  const reportRef = useRef<HTMLDivElement>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  // 🔥 データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!baseUrl) {
          console.error("❌ API URL undefined");
          return;
        }

        const url = `${baseUrl}/api/ecg/${recordId}`;
        console.log("🔍 fetch:", url);

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        console.log("status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          console.error("API error:", text);
          return;
        }

        const d = await res.json();
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
          voltage: v,
        }));

        setChartData(waveform);

      } catch (err) {
        console.error("❌ fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recordId, baseUrl]);

  // 🔥 PDF
  const exportPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    if (!reportRef.current) return;

    await html2pdf().from(reportRef.current).save();
  };

  // 🔥 コメント保存
  const saveComment = async () => {
    try {
      if (!baseUrl) return;

      const url = `${baseUrl}/api/ecg/${recordId}/comment`;

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: comment,
      });

      console.log("save status:", res.status);

      if (res.ok) {
        alert("保存しました");
      } else {
        const text = await res.text();
        console.error("save error:", text);
      }

    } catch (err) {
      console.error("❌ save error:", err);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <main className="p-10">
      <button onClick={() => router.push("/")}>戻る</button>

      <h1>{data?.patient.name}</h1>

      <div style={{ height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <Line dataKey="voltage" stroke="blue" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button onClick={saveComment}>保存</button>

      <button onClick={exportPDF}>PDF</button>
    </main>
  );
}