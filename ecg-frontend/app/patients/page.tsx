"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Patient = { id: number; name: string; age: number; gender: string };

export default function PatientManagementPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", age: "", gender: "Male" });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://ecg-backend-api.onrender.com";

  const fetchPatients = async () => {
    const res = await fetch(`${baseUrl}/api/patients`, { credentials: "include" });
    if (res.ok) setPatients(await res.json());
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${baseUrl}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPatient, age: parseInt(newPatient.age) }),
      credentials: "include",
    });

    if (res.ok) {
      alert("患者を登録しました");
      setShowForm(false);
      setNewPatient({ name: "", age: "", gender: "Male" });
      fetchPatients();
    }
  };

  return (
    <main className="p-6 sm:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Patient Directory</h1>
            <p className="text-sm text-gray-500 font-bold">患者管理・新規登録</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all"
          >
            {showForm ? "閉じる" : "+ 新規患者登録"}
          </button>
        </header>

        {/* 登録フォーム */}
        {showForm && (
          <form onSubmit={handleRegister} className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 mb-10 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Name</label>
                <input 
                  required
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-blue-500 outline-none"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Age</label>
                <input 
                  required type="number"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-blue-500 outline-none"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Gender</label>
                <select 
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-2 focus:border-blue-500 outline-none"
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all">
              患者情報をデータベースに保存
            </button>
          </form>
        )}

        {/* 患者リスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">ID: PT-{p.id.toString().padStart(4, '0')}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-6">
                <span>{p.age} years old</span>
                <span className="font-bold">{p.gender}</span>
              </div>
              {/* ここに「この患者のデータを見る」というボタンを置く */}
              <Link href={`/?searchId=${p.id}`}>
                <button className="w-full py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">
                  VIEW HISTORY ➔
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}