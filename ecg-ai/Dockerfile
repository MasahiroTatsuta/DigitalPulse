# 軽量で安定したPython 3.10環境を使用
FROM python:3.10-slim

# 作業ディレクトリの設定
WORKDIR /app

# ライブラリのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリのコードとAIモデルをコピー
COPY . .

# Cloud Runの仕様に合わせてポート8080で起動
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]