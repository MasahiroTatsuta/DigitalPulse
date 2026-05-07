import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// 注意: 下記のパスは、実際の login/page.tsx の場所に合わせて修正してください
// （例: src/app/login/page.tsx にある場合は '../src/app/login/page' など）
import LoginPage from '../app/login/page'; 
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// NextAuth および Next Navigation のモック（仮の動きをする設定）
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // useRouterのモック設定: { push: jest.fn() }
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  // TC-L04, TC-L05, EM-03, EM-04: ブラウザバリデーションの確認
  test('入力フィールドにHTML5 required属性が設定されていること', () => {
    render(<LoginPage />);
    
    // required属性により未入力を検知し送信不可になることの確認
    expect(screen.getByPlaceholderText(/Enter your ID/i)).toHaveAttribute('required');
    expect(screen.getByPlaceholderText(/••••••••/)).toHaveAttribute('required');
  });

  // TC-L01, ST-02: 正常ログイン遷移
  test('正常な認証情報でログイン成功時、ダッシュボードへリダイレクトされること', async () => {
    // ログイン成功モック: { error: null }
    (signIn as jest.Mock).mockResolvedValueOnce({ error: null });
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/Enter your ID/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        username: 'admin',
        password: 'password123',
      });
      // ダッシュボード（/）への遷移確認
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  // TC-L02, TC-L03, ST-03, EM-01, EM-02: エラーメッセージ表示
  test('ログイン失敗時にエラーメッセージが赤字で表示され、リダイレクトされないこと', async () => {
    // ログイン失敗モック: { error: 'Credentials Signin' }
    (signIn as jest.Mock).mockResolvedValueOnce({ error: 'Credentials Signin' });
    render(<LoginPage />);

    // 存在しないユーザーIDの入力
    fireEvent.change(screen.getByPlaceholderText(/Enter your ID/i), { target: { value: 'not_exist' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      const errorMessage = screen.getByText('IDまたはパスワードが正しくありません');
      expect(errorMessage).toBeInTheDocument();
      // 赤字表示の確認（Tailwind CSSのクラス名）
      expect(errorMessage).toHaveClass('text-red-500'); 
      // 同一ページに留まる（リダイレクトされない）ことの確認
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});