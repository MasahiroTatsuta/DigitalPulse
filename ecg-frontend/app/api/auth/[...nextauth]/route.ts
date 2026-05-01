import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },

      async authorize(credentials) {
        console.log("=== AUTHORIZE START ===");

        // ① 環境変数確認
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
        console.log("credentials:", credentials);

        if (!process.env.NEXT_PUBLIC_API_URL) {
          console.error("❌ API URL is undefined");
          return null;
        }

        try {
          const url = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`;
          console.log("fetch URL:", url);

          const res = await fetch(url, {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" },
          });

          console.log("status:", res.status);
          console.log("ok:", res.ok);

          // ② 生レスポンス確認
          const text = await res.text();
          console.log("raw response:", text);

          let user = null;

          // ③ JSONパース確認
          try {
            user = JSON.parse(text);
          } catch (e) {
            console.error("❌ JSON parse error:", e);
          }

          console.log("parsed user:", user);

          // ④ 成功条件を厳密化
          if (res.ok && user && user.id) {
            console.log("✅ LOGIN SUCCESS");
            return {
              id: user.id,
              name: user.username || user.name || "user",
            };
          }

          console.log("❌ LOGIN FAILED (return null)");
          return null;

        } catch (err) {
          console.error("❌ FETCH ERROR:", err);
          return null;
        }
      }
    })
  ],

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };