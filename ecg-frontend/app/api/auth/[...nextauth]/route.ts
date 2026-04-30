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
        // Spring BootのAPIに問い合わせ
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        });
        const user = await res.json();

        if (res.ok && user) {
          return user; // ログイン成功
        }
        return null; // ログイン失敗
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  // 環境変数から読み込む設定を追加
  secret: process.env.NEXTAUTH_SECRET, 
});

export { handler as GET, handler as POST };