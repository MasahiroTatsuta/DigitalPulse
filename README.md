# DigitalPulse - Integrated ECG Analysis & AI Monitoring System

**DigitalPulse** は、MIT-BIH整脈データベースを活用した、医療従事者向けの次世代心電図解析プラットフォームです。  
AIによる自動診断支援、高精度な波形可視化、そして臨床レポート出力機能を備え、医療現場のデジタル化を強力にサポートします。

### URL
https://digital-pulse-psi.vercel.app

### テストログイン用アカウント
- ID: admin
- PW: password123

---

## 🚀 主要機能 (Key Features)

### 1. インタラクティブ波形解析
- **高精度可視化**: Rechartsを用いたスケーラブルな波形表示。Brush機能による特定区間のズーム解析が可能。  
- **波形最適化ロジック**: データセット特有のパディング（末尾の無駄なフラットライン）を自動でトリミングし、心拍の主要部分を強調。

### 2. AI自動診断 & フィルタリング
- **不整脈分類**: MIT-BIHデータセットに基づき、SVEB、VEB、Fusion、Unknownの4種の異常を自動検知。  
- **高度な検索機能**: 500件以上の記録から、特定の患者IDや異常フラグによる瞬時の絞り込み。

### 3. プロフェッショナルPDFレポート
- **臨床報告書発行**: 患者情報、解析グラフ、医師の所見を統合したA4サイズのPDFレポートをワンクリックで出力。

### 4. セキュアな認証基盤
- **NextAuth.js連携**: 医療情報（PHR）を保護するための、ログイン・セッション管理機能。  
- **アクセス制御**: Middlewareを用いた、未認証ユーザーによるデータアクセス制限。

---

## 🛠 技術スタック (Tech Stack)

### フロントエンド
- **Next.js 16 (App Router)**: 最新のReactフレームワークによる高速なレンダリング。  
- **Tailwind CSS v4**: 高度なデザインシステムとレスポンシブ対応。  
- **Framer Motion**: 清潔感のある、滑らかなUIアニメーション。  
- **Recharts / html2pdf.js**: データ可視化とレポート出力。

### バックエンド
- **Java 21 / Spring Boot 3.4**: 堅牢で拡張性の高いAPIサーバー。  
- **Spring Data JPA**: MySQLとのシームレスなデータ連携。  
- **MySQL 8.4**: リレーショナルデータベースによる厳格なデータ管理。

### データエンジニアリング
- **Node.js (csv-parser)**: Kaggleのビッグデータを加工し、DBへ正規化してインポート。

---

## 🧠 技術的な挑戦と解決策 (Technical Challenges)

### 1. 最新CSSとPDFライブラリの互換性エラーの解決
Tailwind CSS v4が採用する最新のカラーフォーマット（oklch / ldb）が、PDF出力ライブラリ（html2canvas）でエラーを引き起こす問題に直面しました。  
- **解決策**: PDF生成の直前にDOMをクローンし、計算済みスタイル（Computed Style）を標準的なRGB形式に強制変換して上書きするロジックを実装することで解決しました。

### 2. データ構造の最適化
MIT-BIHデータセットは固定長（187サンプル）であり、短い心拍では後半が0で埋め尽くされ、グラフが左に寄る視認性の悪さがありました。  
- **解決策**: 配列を末尾からスキャンし、有効なデータ点までを動的に切り出す（Trimming）処理をフロントエンドに実装。常に波形が中央に大きく表示されるUXを実現しました。

### 3. フルスタックな認証フローの構築
Next.jsのクライアントサイド認証と、Spring BootのDBベース認証をいかにセキュアに繋ぐかが課題でした。  
- **解決策**: NextAuthのCredentialsProviderを用い、バックエンドのカスタムAPIを通じて認証を行うハイブリッド構成を採用。Middlewareでディレクトリ単位の保護を完結させました。

---

## 📦 セットアップ手順 (Installation)

### バックエンド (Spring Boot)
1. `src/main/resources/application.properties` にMySQLの設定を記述  
2. `. /mvnw spring-boot:run`

### フロントエンド (Next.js)
1. `npm install`  
2. `.env.local` に `NEXTAUTH_SECRET` と `NEXTAUTH_URL` を設定  
3. `npm run dev`

---

## 📧 Contact

開発者へのフィードバックやお問い合わせは、[GitHub Issues] または [Your Email] まで。