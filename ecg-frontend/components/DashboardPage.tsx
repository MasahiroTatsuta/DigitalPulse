const fetchRecords = async () => {
  setLoading(true);

  const params = new URLSearchParams();
  if (searchId) params.append("patientId", searchId);
  if (onlyAnomaly) params.append("isAnomaly", "true");

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!baseUrl) {
      throw new Error("API URL is not defined");
    }

    const url = `${baseUrl}/api/ecg/search?${params}`;
    console.log("fetch URL:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 🔥 認証対応
      cache: "no-store",
    });

    console.log("status:", res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error("API error response:", text);
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    console.log("data:", data);

    setRecords(data);

  } catch (err) {
    console.error("❌ Fetch error:", err);
    setRecords([]); // 安全対策
  } finally {
    setLoading(false);
  }
};