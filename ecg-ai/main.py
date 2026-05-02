from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

# .envファイルから環境変数を読み込む
load_dotenv()

# OpenAIクライアントの初期化（APIキーが自動で読み込まれます）
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

app = FastAPI(title="DigitalPulse AI API", version="1.0")

# 1. CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. モデルの読み込み
print("Loading AI Model...")
try:
    model = models.Sequential([
        layers.Input(shape=(187, 1)),
        layers.Conv1D(filters=32, kernel_size=5, activation='relu'),
        layers.MaxPooling1D(pool_size=2),
        layers.Conv1D(filters=64, kernel_size=3, activation='relu'),
        layers.MaxPooling1D(pool_size=2),
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dense(5, activation='softmax')
    ])
    model.load_weights('ecg_model.keras')
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    model = None

CLASS_NAMES = {
    0: "Normal (正常)",
    1: "SVEB (上室性期外収縮)",
    2: "VEB (心室性期外収縮)",
    3: "Fusion (心室融合不整脈)",
    4: "Unknown (分類不能)"
}

class EcgRequest(BaseModel):
    waveform: list[float]

# 4. 推論 ＆ 所見生成エンドポイント
@app.post("/api/predict")
async def predict_ecg(request: EcgRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="AI Model is not loaded.")
    
    try:
        # --- 1. AIによる波形分類 ---
        waveform_data = np.array(request.waveform)
        if len(waveform_data) != 187:
             raise HTTPException(status_code=400, detail="Waveform data must contain exactly 187 values.")

        input_data = waveform_data.reshape(1, 187, 1)
        predictions = model.predict(input_data)
        
        predicted_class_idx = int(np.argmax(predictions[0]))
        predicted_class_name = CLASS_NAMES[predicted_class_idx]
        confidence = float(predictions[0][predicted_class_idx]) * 100

        print(f"Prediction: {predicted_class_name} ({confidence:.2f}%)")

        # --- 2. OpenAI APIによる所見アシスト生成 ---
        # 正常な場合と異常な場合でAIへの指示（プロンプト）を変えます
        if predicted_class_idx == 0:
            prompt = f"患者の心電図をAIが解析した結果、「{predicted_class_name}」 (確信度: {confidence:.1f}%) と判定されました。医師の負担を減らすため、電子カルテにそのまま記載できる簡潔な「所見」と「方針（異常なし、経過観察など）」を2〜3文で出力してください。"
        else:
            prompt = f"患者の心電図をAIが解析した結果、「{predicted_class_name}」 (確信度: {confidence:.1f}%) と判定されました。医師の負担を減らすため、この不整脈の一般的な特徴に触れつつ、電子カルテにそのまま記載できる「所見」と、推奨される「次の方針（追加検査など）」を3〜4文で出力してください。"

        print("Generating report via OpenAI API...")
        
        # ChatGPT (gpt-4o-mini は高速で安価な最新モデル) にリクエスト
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "あなたはプロの循環器内科医をサポートする優秀な医療AIアシスタントです。専門的かつ簡潔なトーンで出力してください。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3 # 0に近いほど事実に基づいた堅い文章になります
        )
        
        generated_report = response.choices[0].message.content
        print("✅ Report generated!")

        # --- 3. 最終結果を返す ---
        return {
            "prediction_code": predicted_class_idx,
            "prediction_name": predicted_class_name,
            "confidence": f"{confidence:.2f}%",
            "is_anomaly": predicted_class_idx != 0,
            "generated_report": generated_report # ← 生成された文章を追加！
        }

    except Exception as e:
        print(f"Error during prediction/generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}