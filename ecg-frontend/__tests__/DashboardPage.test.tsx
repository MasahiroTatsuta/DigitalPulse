import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/components/DashboardPage"; // ご提示のパスを反映
import "@testing-library/jest-dom";

// 🌟 1. next/navigation のモックを追加（searchParams.get のエラーを回避）
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === "searchId") return ""; // 初期値として空文字を返す
      return null;
    }),
  }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// fetchのモック作成
global.fetch = jest.fn();

describe("DashboardPage Pagination & DTO Test", () => {
  // 各テストの前にフェッチのモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("APIから届いたanomalyフラグに基づいて正しいバッジが表示されること", async () => {
    // 🌟 修正後のDTO形式のダミーレスポンス
    const mockData = {
      content: [
        {
          id: 568,
          patientId: 502,
          patientName: "たつた",
          anomaly: true, // 修正後のキー名
          doctorComment: "異常あり",
          recordedAt: "2026-05-07T04:38:25",
        },
      ],
      totalPages: 1,
      totalElements: 1,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<DashboardPage />);

    // ローディング後の表示を確認
    await waitFor(() => {
      // 🌟 anomaly: true なので ANOMALY DETECTED が表示されるはず
      expect(screen.getByText("ANOMALY DETECTED")).toBeInTheDocument();
      // 患者名が表示されているか
      expect(screen.getByText("たつた")).toBeInTheDocument();
    });
  });

  it("ページネーションのページ番号が正しく表示されること", async () => {
    const mockData = {
      content: [],
      totalPages: 5,
      totalElements: 100,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      // 🌟 1. /^Page/i でページネーションのラベルを確認（ここはOK）
      expect(screen.getByText(/^Page/i)).toBeInTheDocument();
      
      // 🌟 2. 数字の確認
      // getByText("1") だと統計カードと重複するので、getAllByText を使い
      // 「少なくとも1つ以上存在する」ことを確認するように変更します
      expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
      
      // 同様に "5" も確認
      expect(screen.getAllByText(/5/).length).toBeGreaterThanOrEqual(1);

      // 🌟 3. (オプション) より正確に確認したい場合
      // 統計カードの「Active Page」という見出しが消えていないかも確認
      expect(screen.getByText("Active Page")).toBeInTheDocument();
    });
  });
});