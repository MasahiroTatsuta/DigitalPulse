"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("IDまたはパスワードが正しくありません");
    } else {
      router.push("/");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold">ECG System</h1>
          <p className="mt-2 text-blue-100 italic">Medical Professional Access</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Username (ID)</label>
            <input 
              type="text" required value={username} onChange={(e)=>setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your ID"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input 
              type="password" required value={password} onChange={(e)=>setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all">
            Login
          </button>
        </form>
      </div>
    </main>
  );
}