// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // カスタム処理が必要ならここに書きますが、
    // 基本は withAuth が自動で認証チェックをしてくれます。
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

// 保護するページの指定
export const config = {
  matcher: ["/records/:path*"],
};