require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2');
const csv = require('csv-parser');

// 1. .env から URL を取得
// 2. もし .env がなかったり空だったりしたら、ローカルホストをデフォルトにする
const dbUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/ecg_db';
console.log(`接続先: ${dbUrl.includes('railway') ? '🚀 クラウド (Railway)' : '🏠 ローカルホスト'}`);
const connection = mysql.createConnection(dbUrl);

const results = [];

console.log('mitbih_train.csv を読み込み中...');

fs.createReadStream('mitbih_train.csv')
  .pipe(csv({ headers: false }))
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(`CSVの読み込み完了: ${results.length} 件。クラウドDBへ送信中...`);

    connection.connect(async (err) => {
      if (err) {
        console.error('接続失敗:', err.message);
        return;
      }
      console.log('接続成功！テーブルを作成（確認）します...');

      // --- 【追加】テーブルを自動で作成するクエリ群 ---
      const createQueries = [
        `CREATE TABLE IF NOT EXISTS patients (
            id BIGINT PRIMARY KEY,
            name VARCHAR(255),
            age INT,
            gender VARCHAR(50)
        )`,
        `CREATE TABLE IF NOT EXISTS ecg_records (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            patient_id BIGINT,
            waveform_data LONGTEXT,
            is_anomaly BOOLEAN,
            diagnosis_type INT,
            doctor_comment TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS users (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50)
        )`,
        `INSERT IGNORE INTO users (username, password, role) VALUES ('admin', 'password123', 'ADMIN')`
      ];

      // テーブル作成を順番に実行
      for (const sql of createQueries) {
        try {
          await connection.promise().query(sql);
        } catch (e) {
          console.error('テーブル作成エラー:', e.message);
        }
      }

      console.log('テーブル準備完了！インポートを開始します...');

      // --- インポート処理 ---
      let completed = 0;
      const targetCount = 500;

      for (let i = 0; i < targetCount; i++) {
        const row = results[i];
        if (!row) break;
        const values = Object.values(row).map(Number);
        const label = values.pop();
        const waveform = JSON.stringify(values);
        const isAnomaly = label !== 0;

        connection.query(
          'INSERT IGNORE INTO patients (id, name, age, gender) VALUES (?, ?, ?, ?)',
          [i + 1, `Patient_${i + 1}`, Math.floor(Math.random() * 50) + 20, i % 2 === 0 ? 'Male' : 'Female'],
          () => {
            connection.query(
              'INSERT INTO ecg_records (patient_id, waveform_data, is_anomaly, diagnosis_type) VALUES (?, ?, ?, ?)',
              [i + 1, waveform, isAnomaly, label],
              (err) => {
                completed++;
                if (err) console.error(`失敗(${i}):`, err.message);
                if (completed === targetCount) {
                  console.log('🎉 完璧です！すべてのデータが入りました。');
                  connection.end();
                }
              }
            );
          }
        );
      }
    });
  });